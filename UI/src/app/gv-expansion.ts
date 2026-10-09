export interface ExpandedGv {
    gv: number;
    expansionCount: number;
    limited: boolean;
}

export function expandGv(base: number, draws: { integer: (maximum: number) => number }, signed = false): ExpandedGv {
    let gv = base;
    let expansionCount = 0;
    const extreme = signed ? Math.abs(base) >= 950 : base > 950;
    const maximumIterations = signed ? 100 : Infinity;
    if (extreme) {
        while (expansionCount < maximumIterations) {
            const magnitude = draws.integer(100);
            const sign = signed ? (draws.integer(1) ? 1 : -1) : 1;
            gv += magnitude * sign;
            expansionCount++;
            if (magnitude <= (signed ? 90 : 95)) {
                return { gv, expansionCount, limited: false };
            }
        }
    }
    return { gv, expansionCount, limited: extreme && expansionCount >= maximumIterations };
}

export function calculateLiveGv(draws: { integer: (maximum: number) => number }): ExpandedGv & { baseGv: number } {
    const baseGv = draws.integer(2000) - 1000;
    return { ...expandGv(baseGv, draws, true), baseGv };
}
