import { Rate } from './rate-list';
import { expandGv } from './gv-expansion';

export interface AnalysisResult extends Rate {
    energeticScore: number;
    gv: number;
}

export class HotbitsExhausted extends Error {
    constructor() {
        super('Insufficient hotbits. Collect more and retry. No results were produced.');
    }
}

export class HotbitDraws {
    private cursor = 0;
    constructor(private readonly words: Uint32Array) {}

    get consumed(): number {
        return this.cursor;
    }

    integer(maximum: number): number {
        if (!Number.isInteger(maximum) || maximum < 0 || maximum > 0xffffffff) {
            throw new Error('Invalid random range.');
        }
        const range = maximum + 1;
        const limit = Math.floor(0x100000000 / range) * range;
        while (this.cursor < this.words.length) {
            const value = this.words[this.cursor++];
            if (value < limit) {
                return value % range;
            }
        }
        throw new HotbitsExhausted();
    }
}

export function analyzeRates(rates: Rate[], draws: { integer: (maximum: number) => number }): AnalysisResult[] {
    if (!rates.length) {
        throw new Error('Load at least one rate before analysis.');
    }
    const scored = rates.map((rate) => {
        let energeticScore = 0;
        for (let index = 0; index < 10; index++) {
            energeticScore += draws.integer(10);
        }
        return { ...rate, energeticScore, gv: 0 };
    });
    scored.sort(
        (left, right) => right.energeticScore - left.energeticScore || left.originalIndex - right.originalIndex,
    );
    const selected = scored.slice(0, 20);
    for (const rate of selected) {
        rate.gv = calculateGv(draws);
    }
    return selected.sort(
        (left, right) =>
            right.gv - left.gv ||
            right.energeticScore - left.energeticScore ||
            left.originalIndex - right.originalIndex,
    );
}

export function calculateGv(draws: { integer: (maximum: number) => number }): number {
    const base = Math.max(draws.integer(1000), draws.integer(1000), draws.integer(1000));
    return expandGv(base, draws).gv;
}
