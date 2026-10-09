import { parseRates } from './rate-list';
import { RateListStore } from './rate-list-store';

describe('Rate parsing', () => {
    it('ignores blanks while preserving spelling, duplicate rows and line identities', () => {
        expect(
            parseRates('\uFEFF Arnica \r\n\r\nChina\nArnica').map((rate) => [rate.name, rate.originalIndex]),
        ).toEqual([
            ['Arnica', 0],
            ['China', 2],
            ['Arnica', 3],
        ]);
        expect(parseRates(' \n\t')).toEqual([]);
    });

    it('only turns HTTP(S) information into links', () => {
        const rates = parseRates('A\thttps://example.com\nB\tjavascript:alert(1)\nC\tinformation');
        expect(rates[0].url).toBe('https://example.com/');
        expect(rates[1].url).toBeUndefined();
        expect(rates[2].url).toBeUndefined();
    });
});

describe('Local rate storage', () => {
    const store = new RateListStore();
    beforeEach(() => localStorage.clear());

    it('persists, renames, edits and deletes without changing identity or creation time', () => {
        const initial = store.save([], 'First', 'Arnica');
        expect(store.load()).toEqual(initial);
        const changed = store.save(initial, 'Renamed', 'China', initial[0].id);
        expect(changed[0].id).toBe(initial[0].id);
        expect(changed[0].createdAt).toBe(initial[0].createdAt);
        expect(changed[0].content).toBe('China');
        expect(store.remove(changed, changed[0].id)).toEqual([]);
        expect(store.load()).toEqual([]);
    });

    it('rejects empty lists and preserves malformed storage for recovery', () => {
        expect(() => store.save([], 'Empty', '\n')).toThrow();
        localStorage.setItem('radionics.rate-lists.v1', '{broken');
        expect(() => store.load()).toThrow();
        expect(localStorage.getItem('radionics.rate-lists.v1')).toBe('{broken');
    });

    it('surfaces quota errors without mutating the caller list', () => {
        const lists = store.save([], 'First', 'A');
        const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('Storage full', 'QuotaExceededError');
        });
        expect(() => store.save(lists, 'Second', 'B')).toThrow();
        expect(lists.length).toBe(1);
        spy.mockRestore();
    });
});
