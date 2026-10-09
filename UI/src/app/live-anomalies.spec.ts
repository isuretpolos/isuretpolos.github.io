import { describe, expect, it } from 'vitest';
import { findAnomalyRuns } from './live-anomalies';

const points = (values: number[]) => values.map((gv, index) => ({ gv, elapsedMs: index * 1000 }));

describe('Live anomaly runs', () => {
    it('marks complete positive and negative runs including their beginning', () => {
        const runs = findAnomalyRuns(points([600, 700, 800, 0, -600, -700, -800]), 500, 3);
        expect(runs.map((run) => run.direction)).toEqual(['high', 'low']);
        expect(runs[0].points.map((point) => point.gv)).toEqual([600, 700, 800]);
    });

    it('does not combine opposite sides or include readings exactly on the limit', () => {
        expect(findAnomalyRuns(points([600, -600, 700, 500, 800, -500]), 500, 2)).toEqual([]);
    });

    it('splits runs at missing-measurement gaps', () => {
        expect(
            findAnomalyRuns(
                [
                    { gv: 600, elapsedMs: 0 },
                    { gv: 700, elapsedMs: 13000 },
                ],
                500,
                2,
            ),
        ).toEqual([]);
    });

    it('re-evaluates the same data for configurable limits without changing it', () => {
        const readings = points([300, 400, 450]);
        expect(findAnomalyRuns(readings, 500, 3)).toEqual([]);
        expect(findAnomalyRuns(readings, 200, 3)).toHaveLength(1);
        expect(findAnomalyRuns(readings, 200, 4)).toEqual([]);
        expect(readings).toEqual(points([300, 400, 450]));
    });
});
