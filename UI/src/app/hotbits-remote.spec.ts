import { IDBFactory } from 'fake-indexeddb';
import { TestBed } from '@angular/core/testing';
import { HotbitStore } from './hotbit-store';
import { allocationUrl, HotbitsConnectionService, parsePairing } from './hotbits-connection';
import { HotbitsInventoryService } from './hotbits-inventory';

const endpoint = 'https://192.168.1.20:8085/api/hotbits/v1';
const payload = { type: 'aetherone-hotbits', protocolVersion: 1, endpoint, pairingCode: 'secret' };

describe('Remote hotbit security and persistence', () => {
    beforeEach(() => {
        vi.stubGlobal('indexedDB', new IDBFactory());
        localStorage.clear();
    });
    afterEach(() => {
        TestBed.resetTestingModule();
        vi.unstubAllGlobals();
    });

    it('validates pairing and rejects HTTP, credentials and embedded tokens', () => {
        expect(parsePairing(JSON.stringify(payload)).endpoint).toBe(endpoint);
        for (const invalid of [
            { ...payload, endpoint: endpoint.replace('https:', 'http:') },
            { ...payload, accessToken: 'secret' },
            { ...payload, protocolVersion: 2 },
            { ...payload, endpoint: 'https://user:password@host/api/hotbits/v1' },
        ]) {
            expect(() => parsePairing(JSON.stringify(invalid))).toThrow();
        }
        expect(() => allocationUrl(endpoint, 'https://evil.test/data', 'abc')).toThrow();
        expect(() => allocationUrl(endpoint, '//evil.test/data', 'abc')).toThrow();
        expect(allocationUrl(endpoint, '/api/hotbits/v1/allocations/abc/data', 'abc')).toContain('192.168.1.20');
    });

    it('imports the 12500-byte fixture once and preserves exact little-endian words', () => {
        const store = new HotbitStore();
        const bytes = Uint8Array.from({ length: 12500 }, (_, index) => index % 256);
        const record = { remoteRequest: 'request', allocationId: 'allocation' };
        return store
            .importRemote(record, bytes)
            .then(() => new HotbitStore().importRemote(record, bytes))
            .then(() => store.counts())
            .then((counts) => {
                expect(counts.available).toBe(3125);
                return new Promise<void>((resolve, reject) => {
                    const request = indexedDB.open('radionics.hotbits.v1');
                    request.onsuccess = () => {
                        const transaction = request.result.transaction('batches');
                        const batches = transaction.objectStore('batches').getAll();
                        transaction.oncomplete = () => {
                            const restored = new Uint8Array(12500);
                            const view = new DataView(restored.buffer);
                            batches.result[0].words.forEach((word: number, index: number) =>
                                view.setUint32(index * 4, word, true),
                            );
                            expect(restored).toEqual(bytes);
                            request.result.close();
                            resolve();
                        };
                        transaction.onabort = () => reject(transaction.error);
                    };
                });
            });
    });

    it('preserves partial bytes across allocations and disables pseudo-random fallback in strict mode', () => {
        const store = new HotbitStore();
        store.trngOnly = true;
        return store
            .importRemote({ remoteRequest: 'a', allocationId: 'a' }, new Uint8Array([1, 2, 3]))
            .then(() => store.importRemote({ remoteRequest: 'b', allocationId: 'b' }, new Uint8Array([4])))
            .then(() => store.counts())
            .then((counts) => expect(counts.available).toBe(1))
            .then(() => expect(store.broadcastResonance(2, 1)).rejects.toThrow('Insufficient'));
    });

    it('reuses the allocation after failed ACK across service reloads without downloading twice', () => {
        const bytes = new Uint8Array(12500);
        let ackFails = true;
        const api = vi.fn((path: string) => {
            if (path === '/allocations') {
                return crypto.subtle.digest('SHA-256', bytes).then((hash) => ({
                    allocationId: 'abc',
                    countBytes: bytes.length,
                    sha256: Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join(''),
                    downloadUrl: '/api/hotbits/v1/allocations/abc/data',
                }));
            }
            return ackFails ? Promise.reject(new Error('ACK unavailable')) : Promise.resolve(undefined);
        });
        const connection = {
            connected: () => false,
            endpoint: () => endpoint,
            cancel: vi.fn(),
            api,
            refresh: vi.fn().mockResolvedValue({ availableBytes: 12500, maxBatchBytes: 65536 }),
            download: vi.fn().mockResolvedValue(bytes.buffer),
        };
        TestBed.configureTestingModule({ providers: [{ provide: HotbitsConnectionService, useValue: connection }] });
        const inventory = TestBed.inject(HotbitsInventoryService);
        inventory.targetBytes = 12500;
        return expect(inventory.refill())
            .rejects.toThrow('ACK unavailable')
            .then(() => {
                ackFails = false;
                TestBed.resetTestingModule();
                TestBed.configureTestingModule({
                    providers: [{ provide: HotbitsConnectionService, useValue: connection }],
                });
                return TestBed.inject(HotbitsInventoryService).refill(false);
            })
            .then(() => {
                expect(api.mock.calls.filter((call) => call[0] === '/allocations')).toHaveLength(1);
                expect(connection.download).toHaveBeenCalledTimes(1);
                return new HotbitStore().counts();
            })
            .then((counts) => expect(counts.available).toBe(3125));
    });
});

describe('Remote import failure boundaries', () => {
    beforeEach(() => {
        vi.stubGlobal('indexedDB', new IDBFactory());
    });
    afterEach(() => {
        TestBed.resetTestingModule();
        vi.unstubAllGlobals();
    });

    it('aborts the entire import when the byte ceiling is exceeded', () => {
        const store = new HotbitStore();
        return expect(store.importRemote({ remoteRequest: 'quota', allocationId: 'quota' }, new Uint8Array(8), 4))
            .rejects.toThrow()
            .then(() => store.counts())
            .then((counts) => {
                expect(counts.available).toBe(0);
                return store.remoteRecords();
            })
            .then((records) => expect(records).toEqual([]));
    });

    it.each(['length', 'hash'])('does not import or ACK a fixture with invalid %s', (failure) => {
        const api = vi
            .fn()
            .mockResolvedValue({
                allocationId: 'bad',
                countBytes: 12500,
                sha256: '0'.repeat(64),
                downloadUrl: '/api/hotbits/v1/allocations/bad/data',
            });
        const connection = {
            connected: () => false,
            endpoint: () => endpoint,
            cancel: vi.fn(),
            api,
            refresh: vi.fn().mockResolvedValue({ availableBytes: 12500, maxBatchBytes: 65536 }),
            download: vi.fn().mockResolvedValue(new Uint8Array(failure === 'length' ? 2 : 12500).buffer),
        };
        TestBed.configureTestingModule({ providers: [{ provide: HotbitsConnectionService, useValue: connection }] });
        const inventory = TestBed.inject(HotbitsInventoryService);
        inventory.targetBytes = 12500;
        return expect(inventory.refill())
            .rejects.toThrow(failure === 'length' ? 'byte count mismatch' : 'SHA-256 mismatch')
            .then(() => inventory.store.counts())
            .then((counts) => {
                expect(counts.available).toBe(0);
                expect(api).toHaveBeenCalledTimes(1);
            });
    });
});
