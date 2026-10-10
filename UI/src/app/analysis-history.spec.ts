import { AnalysisHistory, analysisCsv, analysisAiText } from './analysis-history';

describe('Analysis history', () => {
    beforeEach(() => localStorage.clear());

    const results = [{ name: 'A, "quoted" rate', originalIndex: 0, energeticScore: 50, gv: 900 }];

    it('keeps the newest ten snapshots and restores edited notes', () => {
        const history = new AnalysisHistory();
        for (let index = 0; index < 11; index++) {
            history.add('List ' + index, results);
        }
        const latest = history.entries()[0];
        history.updateNote(latest.id, 'Observation\nSecond line');
        const restored = new AnalysisHistory();
        expect(restored.entries()).toHaveLength(10);
        expect(restored.entries()[0].listName).toBe('List 10');
        expect(restored.entries()[9].listName).toBe('List 1');
        expect(restored.entries()[0].note).toBe('Observation\nSecond line');
        expect(restored.entries()[0].results).toEqual(results);
        expect(Number.isFinite(Date.parse(latest.date))).toBe(true);
    });

    it('escapes CSV fields and includes the identical CSV in the AI request', () => {
        const history = new AnalysisHistory();
        const entry = history.add('Experiment', results);
        entry.note = '=formula\nA note';
        const csv = analysisCsv(entry);
        expect(csv).toContain('"A, ""quoted"" rate"');
        expect(csv).toContain('"\'=formula\nA note"');
        const ai = analysisAiText(entry);
        expect(ai.endsWith(csv)).toBe(true);
        expect(ai).toContain('not a medical emergency, but only an experiment');
        expect(ai).toContain('first 3');
        expect(ai).toContain('all remaining rates');
    });

    it('retains session results when browser storage is full', () => {
        const history = new AnalysisHistory();
        const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('Quota exceeded');
        });
        try {
            history.add('Experiment', results);
            expect(history.entries()).toHaveLength(1);
            expect(history.error()).toContain('could not be saved');
        } finally {
            write.mockRestore();
        }
    });
});
