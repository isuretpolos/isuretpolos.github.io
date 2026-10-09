import { calculateLiveGv } from './gv-expansion';
import { HotbitDraws } from './analysis';

describe('Signed live GV', () => {
    it.each([
        [-1000, 0],
        [0, 1000],
        [949, 1949],
    ])('supports inclusive base %i', (expected, word) => {
        const result = calculateLiveGv(new HotbitDraws(new Uint32Array([word, 0, 1])));
        expect(result.baseGv).toBe(expected);
        expect(result.gv).toBe(expected);
    });
    it('applies independent signed expansions with the specified example', () => {
        const result = calculateLiveGv(new HotbitDraws(new Uint32Array([1972, 96, 1, 94, 0, 37, 1])));
        expect(result).toEqual({ baseGv: 972, gv: 1011, expansionCount: 3, limited: false });
    });
    it('includes magnitude 950 and stops on bonus 90', () => {
        const result = calculateLiveGv(new HotbitDraws(new Uint32Array([50, 90, 0])));
        expect(result.gv).toBe(-1040);
        expect(result.expansionCount).toBe(1);
    });
    it('caps pathological expansions and preserves the calculated value', () => {
        const result = calculateLiveGv({ integer: (maximum) => maximum });
        expect(result.gv).toBe(11000);
        expect(result.expansionCount).toBe(100);
        expect(result.limited).toBe(true);
    });
});
