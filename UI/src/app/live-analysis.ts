import { Component, computed, ElementRef, inject, input, output, effect, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LiveSession } from './live-session';
import { LiveWaveform } from './live-waveform';
import { Fullscreen } from './fullscreen';

@Component({
    selector: 'app-live-analysis',
    imports: [FormsModule, LiveWaveform],
    providers: [LiveSession],
    templateUrl: './live-analysis.html',
    styleUrl: './live-analysis.css',
})
export class LiveAnalysis {
    readonly session = inject(LiveSession);
    readonly fullscreen = inject(Fullscreen);
    readonly mode = input<'simple' | 'advanced'>('simple');
    readonly blocked = input(false);
    readonly available = input(0);
    readonly busyChange = output<boolean>();
    readonly countsChanged = output<void>();
    readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
    readonly current = computed(() => this.session.readings().at(-1)?.gv);
    readonly rates = [10, 30, 60, 120];

    constructor() {
        this.session.onCountsChanged = () => this.countsChanged.emit();
        effect(() => this.busyChange.emit(this.session.state() === 'running' || this.session.pending()));
    }

    setAnomalyThreshold(value: number): void {
        if (Number.isFinite(value) && value >= 0) {
            this.session.anomalyThreshold.set(value);
        }
    }

    setAnomalyMinimum(value: number): void {
        if (Number.isInteger(value) && value >= 2 && value <= 600) {
            this.session.anomalyMinimum.set(value);
        }
    }

    startPause(): void {
        if (this.session.state() === 'running') {
            this.session.pause();
        } else if (!this.blocked()) {
            this.session.start();
        }
    }
    clear(): void {
        if (confirm('Clear this session’s displayed measurements? Export CSV first if needed.')) {
            this.session.clear();
        }
    }
    signed(value: number): string {
        return value >= 0 ? '+' + value : '−' + Math.abs(value);
    }
    elapsed(): string {
        const seconds = Math.floor(this.session.elapsed() / 1000);
        return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
            .map((value) => String(value).padStart(2, '0'))
            .join(':');
    }
    exportCsv(): void {
        const lines = this.session
            .readings()
            .map((value) =>
                [value.timestamp, Math.round(value.elapsedMs), value.baseGv, value.gv, value.expansionCount].join(','),
            );
        const url = URL.createObjectURL(
            new Blob(['timestamp,elapsed_ms,base_gv,final_gv,expansion_count\n' + lines.join('\n')], {
                type: 'text/csv',
            }),
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = 'live-gv-session.csv';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
