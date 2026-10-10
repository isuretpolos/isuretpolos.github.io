import { analyzeRates, HotbitDraws, SpreadDraws } from './analysis';
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
        const draw = vi.fn((maximum: number) => (maximum === 100 ? 0 : maximum));
        const result = analyzeRates(rates(2), { integer: draw });
        expect(draw.mock.calls.filter(([maximum]) => maximum === 10).length).toBe(20);
        expect(draw.mock.calls.filter(([maximum]) => maximum === 1000).length).toBe(6);
        expect(result.map((rate) => [rate.energeticScore, rate.gv])).toEqual([
            [100, 1000],
            [100, 1000],
        ]);
    });

    it.each([
        [888, [], 888],
        [950, [], 950],
        [951, [0], 951],
        [969, [70], 1039],
        [977, [97, 96, 10], 1180],
        [977, [95], 1072],
        [977, [100, 95], 1172],
    ])('extends base GV %i with fresh draws %j to %i', (base, bonuses, expected) => {
        const words = new Uint32Array([...Array(10).fill(0), base, 0, 0, ...bonuses]);
        const draws = new HotbitDraws(words);
        expect(analyzeRates(rates(1), draws)[0].gv).toBe(expected);
        expect(draws.consumed).toBe(words.length);
    });

    it('fails without partial results when an extended GV exhausts hotbits', () => {
        const draws = new HotbitDraws(new Uint32Array([...Array(10).fill(0), 977, 0, 0, 97]));
        expect(() => analyzeRates(rates(1), draws)).toThrow('Insufficient hotbits');
        expect(draws.consumed).toBe(14);
    });

    it('sorts using the extended GV', () => {
        const words = [...Array(20).fill(0), 969, 0, 0, 0, 951, 0, 0, 95];
        const result = analyzeRates(rates(2), new HotbitDraws(new Uint32Array(words)));
        expect(result.map((rate) => [rate.originalIndex, rate.gv])).toEqual([
            [1, 1046],
            [0, 969],
        ]);
    });

    it('preserves duplicate identities and stable score/GV ties while selecting at most 20', () => {
        const result = analyzeRates(rates(25), { integer: () => 0 });
        expect(result.map((rate) => rate.originalIndex)).toEqual(Array.from({ length: 20 }, (_, index) => index));
        expect(analyzeRates(rates(1), { integer: () => 0 }).length).toBe(1);
        expect(() => analyzeRates([], { integer: () => 0 })).toThrow();
    });

    it('takes the maximum GV and orders by GV before score', () => {
        const values = [...Array(10).fill(10), ...Array(10).fill(0), 10, 459, 910, 1000, 0, 0, 0];
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

describe('Spaced hotbit seeding', () => {
    it('spreads 200 hotbits over 450 generated draws', () => {
        const source = new HotbitDraws(new Uint32Array(200));
        const draws = new SpreadDraws(450).bind(source);
        for (let index = 0; index < 450; index++) {
            const value = draws.integer(1000);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(1000);
            if (index === 224) {
                expect(source.consumed).toBe(100);
            }
        }
        expect(source.consumed).toBe(200);
    });
    it('keeps its schedule and generator across broadcast transactions', () => {
        const spread = new SpreadDraws(36000);
        let consumed = 0;
        for (let frame = 0; frame < 1800; frame++) {
            const source = new HotbitDraws(new Uint32Array(1000 - consumed));
            const draws = spread.bind(source);
            for (let rate = 0; rate < 20; rate++) {
                draws.integer(6765);
            }
            consumed += source.consumed;
            if (frame === 899) {
                expect(consumed).toBe(500);
            }
        }
        expect(consumed).toBe(1000);
    });
});
