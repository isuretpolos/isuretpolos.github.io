import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { HotbitStore } from './hotbit-store';

describe('IndexedDB hotbit transactions', () => {
    beforeEach(() => vi.stubGlobal('indexedDB', new IDBFactory()));
    afterEach(() => vi.unstubAllGlobals());

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

    it('retires partial failed attempts rather than replaying their entropy', () => {
        const store = new HotbitStore();
        return store
            .append(new Uint32Array(2))
            .then(() => expect(store.analyze([{ name: 'A', originalIndex: 0 }])).rejects.toThrow('Insufficient'))
            .then(() => store.counts())
            .then((counts) => expect(counts).toEqual({ available: 0, consumed: 2 }));
    });
});
