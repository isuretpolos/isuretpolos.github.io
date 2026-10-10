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

    get available(): number {
        return this.words.length - this.cursor;
    }

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

export class SpreadDraws {
    private state = Math.floor(Math.random() * 0x100000000);
    private position = 0;
    private interval = 1;
    private initialized = false;
    private seeded = false;

    constructor(
        private readonly expected: number,
        private readonly onSeeded: () => void = () => {},
    ) {}

    bind(source: HotbitDraws): { integer: (maximum: number) => number } {
        if (!this.initialized) {
            this.interval = source.available < this.expected ? this.expected / Math.max(1, source.available) : 1;
            this.seeded = this.interval > 1;
            this.initialized = true;
            if (this.seeded) {
                this.onSeeded();
            }
        }
        return {
            integer: (maximum: number): number => {
                if (!this.seeded) {
                    try {
                        return source.integer(maximum);
                    } catch (error) {
                        if (!(error instanceof HotbitsExhausted)) {
                            throw error;
                        }
                        this.seeded = true;
                        this.onSeeded();
                    }
                }
                const reseed =
                    Math.floor(this.position / this.interval) !== Math.floor((this.position - 1) / this.interval);
                if (reseed && source.available) {
                    this.state = (this.state ^ source.integer(0xffffffff)) >>> 0;
                }
                this.position++;
                // Mulberry32 supports every 32-bit seed, including zero.
                this.state = (this.state + 0x6d2b79f5) >>> 0;
                let value = Math.imul(this.state ^ (this.state >>> 15), this.state | 1);
                value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
                return Math.floor((((value ^ (value >>> 14)) >>> 0) / 0x100000000) * (maximum + 1));
            },
        };
    }
}
