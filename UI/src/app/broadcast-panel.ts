import { Component, DestroyRef, ElementRef, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnalysisResult } from './analysis';
import { HotbitStore } from './hotbit-store';
import { BroadcastRate, broadcastDuration } from './broadcast';

@Component({
    selector: 'app-broadcast',
    imports: [FormsModule],
    templateUrl: './broadcast-panel.html',
    styleUrl: './broadcast-panel.css',
})
export class BroadcastPanel {
    readonly results = input<AnalysisResult[]>([]);
    readonly targetGv = input<number | null>(null);
    readonly blocked = input(false);
    readonly busyChange = output<boolean>();
    readonly countsChanged = output<void>();
    private readonly hotbits = inject(HotbitStore);
    private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('field');
    readonly selected = signal<number[]>([]);
    readonly session = signal<BroadcastRate[]>([]);
    readonly running = signal(false);
    readonly status = signal('Choose rates from your analysis.');
    readonly elapsed = signal(0);
    readonly duration = signal(0);
    readonly cycles = signal(1);
    readonly lastGv = signal<number | null>(null);
    seconds = 60;
    multiplier = 1;
    delta = true;
    resonance = true;
    counterCheck = false;
    private timer?: ReturnType<typeof setTimeout>;
    private generation = 0;
    private started = 0;
    private baseline = 0;
    private checkEnabled = false;
    private resonanceEnabled = false;
    private sessionMultiplier = 1;
    private wave = 0;

    constructor() {
        effect(() => {
            this.results();
            this.selected.set([]);
        });
        const hidden = () => {
            if (document.hidden && this.running()) {
                this.stop('Stopped because the page was hidden.');
            }
        };
        document.addEventListener('visibilitychange', hidden);
        inject(DestroyRef).onDestroy(() => {
            this.stop();
            document.removeEventListener('visibilitychange', hidden);
        });
    }

    toggle(index: number): void {
        this.selected.update((values) =>
            values.includes(index) ? values.filter((value) => value !== index) : [...values, index],
        );
    }

    total(): number {
        return this.session().reduce((sum, rate) => sum + rate.resonances, 0);
    }

    start(all = false): void {
        if (this.running() || this.blocked() || document.hidden || this.targetGv() === null) {
            return;
        }
        const rates = this.results().filter((rate) => all || this.selected().includes(rate.originalIndex));
        if (!rates.length) {
            return;
        }
        try {
            this.duration.set(broadcastDuration(Number(this.seconds), this.targetGv()!, this.delta));
            if (!Number.isInteger(this.multiplier) || this.multiplier < 1 || this.multiplier > 1000) {
                throw new Error('Multiplier must be an integer from 1 to 1000.');
            }
        } catch (error) {
            this.status.set((error as Error).message);
            return;
        }
        this.baseline = this.targetGv()!;
        this.checkEnabled = this.counterCheck;
        this.resonanceEnabled = this.resonance;
        this.sessionMultiplier = this.multiplier;
        this.session.set(rates.map((rate) => ({ ...rate, resonances: 0, events: [] })));
        this.elapsed.set(0);
        this.cycles.set(1);
        this.lastGv.set(null);
        this.started = performance.now();
        this.running.set(true);
        this.busyChange.emit(true);
        this.status.set('Broadcasting');
        const token = ++this.generation;
        this.tick(token);
    }

    stop(message = 'Broadcast stopped.'): void {
        ++this.generation;
        clearTimeout(this.timer);
        if (this.running()) {
            this.running.set(false);
            this.busyChange.emit(false);
            this.countsChanged.emit();
            this.status.set(message);
        }
    }

    private tick(token: number): void {
        if (token !== this.generation) {
            return;
        }
        this.elapsed.set(Math.min(this.duration(), (performance.now() - this.started) / 1000));
        if (this.elapsed() >= this.duration()) {
            this.finishCycle(token);
            return;
        }
        const sample = this.resonanceEnabled
            ? this.hotbits.broadcastResonance(this.session().length, this.sessionMultiplier)
            : Promise.resolve(this.session().map(() => false));
        sample
            .then((hits) => {
                if (token !== this.generation) {
                    return;
                }
                this.session.update((rates) =>
                    rates.map((rate, index) =>
                        hits[index]
                            ? {
                                  ...rate,
                                  resonances: rate.resonances + 1,
                                  events: [...rate.events, new Date().toISOString()],
                              }
                            : rate,
                    ),
                );
                if (hits.some(Boolean)) {
                    this.wave = 1;
                }
                this.draw();
                this.timer = setTimeout(() => this.tick(token), 1000 / 30);
            })
            .catch((error) => {
                if (token === this.generation) {
                    this.stop(`Broadcast interrupted: ${(error as Error).message}`);
                }
            });
    }

    private finishCycle(token: number): void {
        if (!this.checkEnabled) {
            this.stop('Broadcast complete.');
            return;
        }
        this.status.set('Checking target GV…');
        this.hotbits
            .targetMeasurement()
            .then((gv) => {
                if (token !== this.generation) {
                    return;
                }
                this.lastGv.set(gv);
                this.countsChanged.emit();
                if (gv >= this.baseline) {
                    this.stop('Broadcast complete: target GV reached.');
                } else {
                    this.cycles.update((value) => value + 1);
                    this.duration.set(10);
                    this.started = performance.now();
                    this.status.set('GV below target; broadcasting for another 10 seconds.');
                    this.tick(token);
                }
            })
            .catch((error) => {
                if (token === this.generation) {
                    this.stop(`GV check failed: ${(error as Error).message}`);
                }
            });
    }

    private draw(): void {
        const canvas = this.canvas()?.nativeElement;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) {
            return;
        }
        const width = canvas.width;
        const height = canvas.height;
        // Visual randomness is independent of the stored hotbits used for resonance checks.
        const color = () => `hsla(${Math.random() * 360}, 90%, 65%, .65)`;
        context.fillStyle = 'rgba(9, 5, 28, .09)';
        context.fillRect(0, 0, width, height);
        context.strokeStyle = color();
        for (const radius of [120, 110, 100]) {
            context.beginPath();
            context.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
            context.stroke();
        }
        for (let index = 0; index < 12; index++) {
            context.fillStyle = color();
            context.fillRect(Math.random() * width, Math.random() * height, 2, 2);
        }
        context.beginPath();
        context.moveTo(Math.random() * width, Math.random() * height);
        context.bezierCurveTo(
            Math.random() * width,
            Math.random() * height,
            Math.random() * width,
            Math.random() * height,
            Math.random() * width,
            Math.random() * height,
        );
        context.stroke();
        const rates = this.session();
        const signature = rates[Math.floor(Math.random() * rates.length)].name;
        context.font = '20px monospace';
        context.fillText(
            signature.charAt(Math.floor(Math.random() * signature.length)),
            Math.random() * width,
            Math.random() * height,
        );
        if (Math.random() < 0.03) {
            context.font = '14px monospace';
            context.fillText(signature, Math.random() * width, Math.random() * height);
        }
        if (this.wave) {
            context.strokeStyle = '#42e6ec';
            context.beginPath();
            context.arc(width / 2, height / 2, this.wave, 0, Math.PI * 2);
            context.stroke();
            this.wave += 5;
            if (this.wave > width) {
                this.wave = 0;
            }
        }
    }
}
