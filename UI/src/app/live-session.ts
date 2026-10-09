import { DestroyRef, inject, Injectable, NgZone, signal } from '@angular/core';
import { HotbitStore } from './hotbit-store';

export const BPM_INTERVALS: Record<number, number> = { 10: 6000, 30: 2000, 60: 1000, 120: 500 };
export interface LiveReading {
    timestamp: string;
    elapsedMs: number;
    baseGv: number;
    gv: number;
    expansionCount: number;
    limited: boolean;
}

@Injectable()
export class LiveSession {
    private readonly store = inject(HotbitStore);
    private readonly zone = inject(NgZone);
    readonly state = signal<'stopped' | 'running' | 'paused'>('stopped');
    readonly bpm = signal(60);
    readonly readings = signal<LiveReading[]>([]);
    readonly total = signal(0);
    readonly expansions = signal(0);
    readonly limits = signal(0);
    readonly available = signal(0);
    readonly positivePeak = signal(0);
    readonly negativePeak = signal(0);
    readonly scale = signal(1000);
    readonly status = signal('Ready');
    readonly pending = signal(false);
    private elapsedBefore = 0;
    private began = 0;
    private due = 0;
    private timer?: ReturnType<typeof setTimeout>;
    private generation = 0;
    onCountsChanged: () => void = () => {};

    constructor() {
        const hidden = () => {
            if (document.hidden) {
                this.pause();
            }
        };
        document.addEventListener('visibilitychange', hidden);
        inject(DestroyRef).onDestroy(() => {
            this.stop();
            document.removeEventListener('visibilitychange', hidden);
        });
    }

    elapsed(): number {
        return this.elapsedBefore + (this.state() === 'running' ? performance.now() - this.began : 0);
    }

    start(): void {
        if (this.pending() || this.state() === 'running') {
            return;
        }
        if (this.state() === 'stopped') {
            this.readings.set([]);
            this.total.set(0);
            this.expansions.set(0);
            this.limits.set(0);
            this.positivePeak.set(0);
            this.negativePeak.set(0);
            this.scale.set(1000);
            this.elapsedBefore = 0;
        }
        const generation = ++this.generation;
        this.pending.set(true);
        this.status.set('Checking Hotbits…');
        this.store
            .counts()
            .then((counts) => {
                if (generation !== this.generation) {
                    return;
                }
                this.available.set(counts.available);
                if (!counts.available) {
                    this.state.set('paused');
                    this.status.set('No Hotbits. Collect more, then Resume.');
                    return;
                }
                this.began = performance.now();
                this.state.set('running');
                this.status.set('Measuring');
                this.due = performance.now() + BPM_INTERVALS[this.bpm()];
                this.schedule();
            })
            .catch(() => this.status.set('Hotbit storage unavailable. Try again.'))
            .finally(() => this.pending.set(false));
    }

    setBpm(bpm: number): void {
        if (!BPM_INTERVALS[bpm]) {
            return;
        }
        this.bpm.set(bpm);
        if (this.state() === 'running') {
            this.due = performance.now() + BPM_INTERVALS[bpm];
            this.schedule();
        }
    }

    pause(): void {
        if (this.state() === 'running') {
            this.elapsedBefore = this.elapsed();
        }
        if (this.state() !== 'stopped' || this.pending()) {
            this.state.set('paused');
            this.status.set('Paused');
        }
        ++this.generation;
        clearTimeout(this.timer);
    }

    stop(): void {
        this.pause();
        this.state.set('stopped');
        this.status.set('Stopped');
    }

    clear(): void {
        this.stop();
        this.readings.set([]);
        this.total.set(0);
        this.expansions.set(0);
        this.limits.set(0);
        this.positivePeak.set(0);
        this.negativePeak.set(0);
        this.scale.set(1000);
        this.elapsedBefore = 0;
    }

    private schedule(): void {
        clearTimeout(this.timer);
        this.zone.runOutsideAngular(() => {
            this.timer = setTimeout(() => this.measure(), Math.max(0, this.due - performance.now()));
        });
    }

    private measure(): void {
        if (this.state() !== 'running') {
            return;
        }
        const interval = BPM_INTERVALS[this.bpm()];
        // Skip missed deadlines rather than synthesizing historical measurements.
        const nextDeadline = this.due + interval;
        this.due = nextDeadline > performance.now() ? nextDeadline : performance.now() + interval;
        this.schedule();
        if (this.pending()) {
            return;
        }
        const generation = this.generation;
        const elapsedMs = this.elapsed();
        const timestamp = new Date().toISOString();
        this.pending.set(true);
        this.store
            .liveMeasurement()
            .then((value) => {
                if (generation !== this.generation || this.state() !== 'running') {
                    return;
                }
                const reading = { ...value, timestamp, elapsedMs };
                this.readings.update((readings) => [...readings, reading].slice(-600));
                this.total.update((total) => total + 1);
                this.expansions.update((count) => count + value.expansionCount);
                if (value.limited) {
                    this.limits.update((count) => count + 1);
                }
                this.positivePeak.update((peak) => Math.max(peak, value.gv));
                this.negativePeak.update((peak) => Math.min(peak, value.gv));
                this.scale.update((scale) => Math.max(scale, Math.ceil(Math.abs(value.gv) / 500) * 500));
            })
            .catch((error) => {
                if (generation !== this.generation) {
                    return;
                }
                this.pause();
                this.status.set(
                    error instanceof Error ? error.message : 'Measurement failed. Collect more Hotbits, then Resume.',
                );
            })
            .finally(() => {
                this.pending.set(false);
                this.store
                    .counts()
                    .then((counts) => this.available.set(counts.available))
                    .catch(() => {});
                this.onCountsChanged();
            });
    }
}
