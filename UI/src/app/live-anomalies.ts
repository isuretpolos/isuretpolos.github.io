export interface AnomalyPoint {
    elapsedMs: number;
    gv: number;
}

export interface AnomalyRun {
    points: AnomalyPoint[];
    direction: 'high' | 'low';
}

export function findAnomalyRuns(
    readings: readonly AnomalyPoint[],
    threshold: number,
    minimumCount: number,
): AnomalyRun[] {
    const runs: AnomalyRun[] = [];
    let points: AnomalyPoint[] = [];
    let direction: 'high' | 'low' | undefined;
    const finish = () => {
        if (direction && points.length >= minimumCount) {
            runs.push({ points, direction });
        }
        points = [];
    };
    for (const reading of readings) {
        const nextDirection = reading.gv > threshold ? 'high' : reading.gv < -threshold ? 'low' : undefined;
        const previous = points.at(-1);
        if (nextDirection !== direction || (previous && reading.elapsedMs - previous.elapsedMs > 12000)) {
            finish();
        }
        direction = nextDirection;
        if (direction) {
            points.push(reading);
        }
    }
    finish();
    return runs;
}
