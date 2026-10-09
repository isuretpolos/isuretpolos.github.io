import { TestBed } from '@angular/core/testing';
import { LiveSession, BPM_INTERVALS } from './live-session';
import { HotbitStore } from './hotbit-store';

describe('Live session scheduling', () => {
    let session: LiveSession;
    const measure = vi.fn();
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
        measure.mockReset().mockResolvedValue({ baseGv: 100, gv: 100, expansionCount: 0, limited: false });
        TestBed.configureTestingModule({
            providers: [
                LiveSession,
                {
                    provide: HotbitStore,
                    useValue: {
                        counts: () => Promise.resolve({ available: 100000, consumed: 0 }),
                        liveMeasurement: measure,
                    },
                },
            ],
        });
        session = TestBed.inject(LiveSession);
    });
    afterEach(() => {
        TestBed.resetTestingModule();
        vi.useRealTimers();
    });
    it.each([10, 30, 60, 120])('uses the correct %i BPM interval', (bpm) => {
        session.setBpm(bpm);
        session.start();
        return vi
            .advanceTimersByTimeAsync(BPM_INTERVALS[bpm] - 1)
            .then(() => {
                expect(measure).not.toHaveBeenCalled();
                return vi.advanceTimersByTimeAsync(1);
            })
            .then(() => expect(measure).toHaveBeenCalledOnce());
    });
    it('retains history through BPM change, pause, resume and stop', () => {
        session.start();
        return vi
            .advanceTimersByTimeAsync(1000)
            .then(() => {
                expect(session.total()).toBe(1);
                session.setBpm(120);
                return vi.advanceTimersByTimeAsync(500);
            })
            .then(() => {
                expect(session.total()).toBe(2);
                session.pause();
                return vi.advanceTimersByTimeAsync(10000);
            })
            .then(() => {
                expect(session.total()).toBe(2);
                session.start();
                return vi.advanceTimersByTimeAsync(500);
            })
            .then(() => {
                expect(session.total()).toBe(3);
                session.stop();
                return vi.advanceTimersByTimeAsync(10000);
            })
            .then(() => {
                expect(session.total()).toBe(3);
                expect(session.readings().length).toBe(3);
            });
    });
    it('bounds history at 600 entries at 120 BPM', () => {
        session.setBpm(120);
        session.start();
        return vi.advanceTimersByTimeAsync(301000).then(() => {
            expect(session.total()).toBe(602);
            expect(session.readings().length).toBe(600);
        });
    });
    it('pauses on exhaustion and scales symmetrically in 500-unit steps', () => {
        measure
            .mockResolvedValueOnce({ baseGv: 972, gv: 1368, expansionCount: 3, limited: false })
            .mockRejectedValueOnce(new Error('Insufficient hotbits'));
        session.start();
        return vi.advanceTimersByTimeAsync(2000).then(() => {
            expect(session.scale()).toBe(1500);
            expect(session.positivePeak()).toBe(1368);
            expect(session.state()).toBe('paused');
            expect(session.status()).toContain('Insufficient');
        });
    });
    it('drops an in-flight result after stop without creating historical points', () => {
        let resolve!: (value: unknown) => void;
        measure.mockImplementation(() => new Promise((done) => (resolve = done)));
        session.start();
        return vi
            .advanceTimersByTimeAsync(1000)
            .then(() => {
                session.stop();
                resolve({ baseGv: 0, gv: 0, expansionCount: 0, limited: false });
                return vi.advanceTimersByTimeAsync(5000);
            })
            .then(() => expect(session.readings()).toEqual([]));
    });
});
