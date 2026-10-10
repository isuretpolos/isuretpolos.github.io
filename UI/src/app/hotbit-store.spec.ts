import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { HotbitStore } from './hotbit-store';

describe('IndexedDB hotbit transactions', () => {
    beforeEach(() => vi.stubGlobal('indexedDB', new IDBFactory()));
    afterEach(() => vi.unstubAllGlobals());

    it('uses remaining hotbits and falls back for subsequent resonance draws', () => {
        const store = new HotbitStore();
        const fallback = vi.fn();
        const random = vi.spyOn(Math, 'random').mockReturnValue(0.99999);
        return store
            .append(new Uint32Array([0]))
            .then(() => store.broadcastResonance(3, 1, fallback))
            .then((hits) => {
                expect(hits).toEqual([false, true, true]);
                expect(fallback).toHaveBeenCalledTimes(2);
                return store.counts();
            })
            .then((counts) => expect(counts).toEqual({ available: 0, consumed: 1 }))
            .finally(() => random.mockRestore());
    });

    it('allows broadcast GV rechecks with empty hotbits while regular target checks still require them', () => {
        const store = new HotbitStore();
        const fallback = vi.fn();
        const random = vi.spyOn(Math, 'random').mockReturnValue(0);
        return store
            .targetMeasurement(fallback)
            .then((gv) => {
                expect(gv).toBe(0);
                expect(fallback).toHaveBeenCalledTimes(3);
                return expect(store.targetMeasurement()).rejects.toThrow('Insufficient hotbits');
            })
            .finally(() => random.mockRestore());
    });
    it('persists binary batches and retires consumed words across service instances', () => {
        const store = new HotbitStore();
        return store
            .append(new Uint32Array(30))
            .then(() => store.analyze([{ name: 'A', originalIndex: 0 }]))
            .then((result) => {
                expect(result[0].energeticScore).toBe(0);
                return new HotbitStore().counts();
            })
            .then((counts) => expect(counts).toEqual({ available: 17, consumed: 13 }));
    });

    it('surfaces quota failures without storing a batch', () => {
        const store = new HotbitStore();
        const spy = vi.spyOn(IDBObjectStore.prototype, 'add').mockImplementation(() => {
            throw new DOMException('Storage full', 'QuotaExceededError');
        });
        return expect(store.append(new Uint32Array(10)))
            .rejects.toThrow('Storage full')
            .then(() => store.counts())
            .then((counts) => expect(counts.available).toBe(0))
            .finally(() => spy.mockRestore());
    });

    it('shares consumption between photo and rate analysis without reusing material', () => {
        const store = new HotbitStore();
        return store
            .append(new Uint32Array(781))
            .then(() => store.analyzePhoto(800, 400, 16))
            .then((cells) => {
                expect(cells.length).toBe(3);
                return store.analyze([{ name: 'A', originalIndex: 0 }]);
            })
            .then(() => store.counts())
            .then((counts) => expect(counts).toEqual({ available: 0, consumed: 781 }));
    });

    it('serializes simultaneous analyses without reusing words', () => {
        const store = new HotbitStore();
        return store
            .append(new Uint32Array(26))
            .then(() =>
                Promise.all([
                    store.analyze([{ name: 'A', originalIndex: 0 }]),
                    new HotbitStore().analyze([{ name: 'B', originalIndex: 0 }]),
                ]),
            )
            .then(() => store.counts())
            .then((counts) => expect(counts).toEqual({ available: 0, consumed: 26 }));
    });

    it('rejects analysis below 20 percent without consuming hotbits', () => {
        const store = new HotbitStore();
        return store
            .append(new Uint32Array(2))
            .then(() => expect(store.analyze([{ name: 'A', originalIndex: 0 }])).rejects.toThrow('Insufficient'))
            .then(() => store.counts())
            .then((counts) => expect(counts).toEqual({ available: 2, consumed: 0 }));
    });
});

describe('Limited analysis supply', () => {
    beforeEach(() => vi.stubGlobal('indexedDB', new IDBFactory()));
    afterEach(() => vi.unstubAllGlobals());
    const rates = Array.from({ length: 39 }, (_, originalIndex) => ({ name: 'Flower', originalIndex }));
    it('completes 39-rate analysis with 200 hotbits', () => {
        const store = new HotbitStore();
        return store
            .append(new Uint32Array(200))
            .then(() => store.analyze(rates))
            .then((result) => {
                expect(result.length).toBe(20);
                return store.counts();
            })
            .then((counts) => expect(counts.consumed).toBe(200));
    });
    it('accepts the exact 20 percent threshold', () => {
        const store = new HotbitStore();
        return store
            .append(new Uint32Array(90))
            .then(() => store.analyze(rates))
            .then((result) => expect(result.length).toBe(20));
    });
});
