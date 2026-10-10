import { AnalysisResult } from './analysis';

export interface BroadcastRate extends AnalysisResult {
    resonances: number;
    events: string[];
}

export function broadcastDuration(seconds: number, targetGv: number, delta: boolean): number {
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 86400 || !Number.isFinite(targetGv) || targetGv < 0) {
        throw new Error('Enter a duration from 1 to 86400 seconds and check target GV.');
    }
    return delta && targetGv < seconds ? seconds - targetGv : seconds;
}

export function resonanceHits(
    count: number,
    multiplier: number,
    draws: { integer: (maximum: number) => number },
): boolean[] {
    return Array.from({ length: count }, () => draws.integer(6764 + multiplier) === 6764 + multiplier);
}
