import { analyzeRates, HotbitDraws } from './analysis';
import { BitConditioner } from './bit-conditioner';

const rates = (count: number) =>
    Array.from({ length: count }, (_, originalIndex) => ({ name: 'Duplicate', originalIndex }));

describe('Direct hotbit draws', () => {
    it('rejects biased remainder values and reaches inclusive endpoints', () => {
        const draws = new HotbitDraws(new Uint32Array([0xffffffff, 10, 0]));
        expect(draws.integer(10)).toBe(10);
        expect(draws.integer(10)).toBe(0);
        expect(draws.consumed).toBe(3);
        expect(() => draws.integer(10)).toThrow('Insufficient');
        expect(new HotbitDraws(new Uint32Array([1000])).integer(1000)).toBe(1000);
    });
});

describe('Two-stage analysis', () => {
    it('makes exactly ten score draws and three GV draws per selected rate', () => {
        const draw = vi.fn((maximum: number) => maximum);
        const result = analyzeRates(rates(2), { integer: draw });
        expect(draw.mock.calls.filter(([maximum]) => maximum === 10).length).toBe(20);
        expect(draw.mock.calls.filter(([maximum]) => maximum === 1000).length).toBe(6);
        expect(result.map((rate) => [rate.energeticScore, rate.gv])).toEqual([
            [100, 1000],
            [100, 1000],
        ]);
    });

    it('preserves duplicate identities and stable score/GV ties while selecting at most 20', () => {
        const result = analyzeRates(rates(25), { integer: () => 0 });
        expect(result.map((rate) => rate.originalIndex)).toEqual(Array.from({ length: 20 }, (_, index) => index));
        expect(analyzeRates(rates(1), { integer: () => 0 }).length).toBe(1);
        expect(() => analyzeRates([], { integer: () => 0 })).toThrow();
    });

    it('takes the maximum GV and orders by GV before score', () => {
        const values = [...Array(10).fill(10), ...Array(10).fill(0), 10, 459, 910, 1000, 0, 0];
        const result = analyzeRates(rates(2), { integer: () => values.shift()! });
        expect(result.map((rate) => [rate.originalIndex, rate.energeticScore, rate.gv])).toEqual([
            [1, 0, 1000],
            [0, 100, 910],
        ]);
    });
});

describe('Bit conditioning and uint32 packing', () => {
    it('discards equal pairs and packs unsigned words', () => {
        const conditioner = new BitConditioner();
        conditioner.accept(0);
        conditioner.accept(0);
        let word: number | undefined;
        for (let index = 0; index < 32; index++) {
            conditioner.accept(1);
            word = conditioner.accept(0);
        }
        expect(word).toBe(0xffffffff);
        expect(conditioner.usable).toBe(32);
        expect(conditioner.rejected).toBe(2);
    });

    it('keeps low-yield startup samples pending until the window is complete', () => {
        const conditioner = new BitConditioner();
        for (let index = 0; index < 39; index++) {
            const bit = index % 2;
            conditioner.accept(bit);
            conditioner.accept(1 - bit);
        }
        for (let index = 0; index < 554; index++) {
            const bit = index % 2;
            conditioner.accept(bit);
            conditioner.accept(bit);
        }
        expect(conditioner.raw).toBe(1186);
        expect(conditioner.usable).toBe(39);
        expect(conditioner.assessment()).toBe('pending');
        for (let index = 0; index < 4096; index++) {
            const bit = index % 2;
            conditioner.accept(bit);
            conditioner.accept(1 - bit);
        }
        expect(conditioner.assessment()).toBe('passed');
    });

    it('rejects severely biased conditioned output after warmup', () => {
        const conditioner = new BitConditioner();
        for (let index = 0; index < 4096; index++) {
            conditioner.accept(0);
            conditioner.accept(1);
        }
        expect(conditioner.assessment()).toBe('failed');
    });

    it('fails checks on stuck samples', () => {
        const conditioner = new BitConditioner();
        for (let index = 0; index < 8192; index++) {
            conditioner.accept(1);
        }
        expect(conditioner.assessment()).toBe('failed');
    });
});
