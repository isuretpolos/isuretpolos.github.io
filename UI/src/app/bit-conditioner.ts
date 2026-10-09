// Von Neumann pairs: 01 -> 0, 10 -> 1; discard 00 and 11.
// This removes bias only under independence assumptions, which cameras may violate.
export class BitConditioner {
    raw = 0;
    ones = 0;
    rejected = 0;
    usable = 0;
    longestRun = 0;
    private last = -1;
    private run = 0;
    private pending: number | undefined;
    private conditionedOnes = 0;
    private word = 0;
    private bits = 0;

    accept(bit: number): number | undefined {
        this.raw++;
        this.ones += bit;
        this.run = bit === this.last ? this.run + 1 : 1;
        this.last = bit;
        this.longestRun = Math.max(this.longestRun, this.run);
        if (this.pending === undefined) {
            this.pending = bit;
            return undefined;
        }
        const first = this.pending;
        this.pending = undefined;
        if (first === bit) {
            this.rejected += 2;
            return undefined;
        }
        this.usable++;
        this.conditionedOnes += first;
        this.word = ((this.word << 1) | first) >>> 0;
        if (++this.bits === 32) {
            const packed = this.word;
            this.word = 0;
            this.bits = 0;
            return packed;
        }
        return undefined;
    }

    healthy(): boolean {
        const bias = this.ones / this.raw;
        const conditionedBias = this.conditionedOnes / this.usable;
        return (
            this.raw >= 512 &&
            this.usable >= 128 &&
            bias > 0.2 &&
            bias < 0.8 &&
            conditionedBias > 0.1 &&
            conditionedBias < 0.9 &&
            this.longestRun < 32
        );
    }
}
