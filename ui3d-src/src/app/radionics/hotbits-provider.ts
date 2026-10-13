export interface HotbitsProvider {
    readonly label: string;
    readonly available: number;
    start(): Promise<void>;
    stop(): void;
    take(): number | undefined;
}

// Browser adaptation of AetherOnePy's MIT-licensed RGB-sum frame comparison.
export function extractFrameBytes(previous: Uint8ClampedArray, current: Uint8ClampedArray): number[] {
    if (previous.length !== current.length || current.length % 4 !== 0) {
        throw new Error('Frame dimensions must match.');
    }
    let difference = 0;
    const bits: number[] = [];
    for (let index = 0; index < current.length; index += 4) {
        let oldSum = 0;
        let newSum = 0;
        for (let channel = 0; channel < 3; channel++) {
            oldSum += previous[index + channel];
            newSum += current[index + channel];
            difference += Math.abs(previous[index + channel] - current[index + channel]);
        }
        bits.push(oldSum > newSum ? 1 : 0);
    }
    if (difference <= 500 || bits.slice(0, 9).every(bit => bit === 0)) {
        return [];
    }
    const bytes: number[] = [];
    for (let index = 0; index + 7 < bits.length; index += 8) {
        bytes.push(bits.slice(index, index + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
    }
    return bytes;
}
