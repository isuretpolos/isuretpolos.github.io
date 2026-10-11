import { Component, DestroyRef, ElementRef, effect, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnalysisResult, calculateGv, SpreadDraws } from './analysis';
import { HotbitStore } from './hotbit-store';
import { BroadcastRate, broadcastDuration, resonanceHits, unseededDraws } from './broadcast';
import { ClearFlash } from './clear-flash';
import { BroadcastWakeLock } from './broadcast-wake-lock';

@Component({
    selector: 'app-broadcast',
    imports: [FormsModule],
    providers: [BroadcastWakeLock],
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
    readonly clearFlash = inject(ClearFlash);
    readonly wakeLock = inject(BroadcastWakeLock);
    private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('field');
    private readonly stage = viewChild<ElementRef<HTMLElement>>('stage');
    readonly immersive = signal(false);
    readonly fullscreenMessage = signal('');
    customRate = '';
    readonly selected = signal<number[]>([]);
    readonly session = signal<BroadcastRate[]>([]);
    readonly running = signal(false);
    readonly status = signal('Choose rates from your analysis.');
    readonly elapsed = signal(0);
    readonly duration = signal(0);
    readonly cycles = signal(1);
    readonly lastGv = signal<number | null>(null);
    readonly randomFallback = signal(false);
    readonly renderMessage = signal('');
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
    private spread?: SpreadDraws;
    private storageFailed = false;
    private previousOverflow = '';

    constructor() {
        effect(() => {
            this.results();
            this.selected.set([]);
        });
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && this.immersive()) {
                this.closeStage();
            } else if (event.key === 'Tab' && this.immersive()) {
                const buttons = this.stage()?.nativeElement.querySelectorAll<HTMLButtonElement>('button');
                if (buttons?.length) {
                    const first = buttons[0];
                    const last = buttons[buttons.length - 1];
                    if (event.shiftKey && document.activeElement === first) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
            }
        };
        const fullscreenChanged = () => {
            if (!document.fullscreenElement && this.immersive()) {
                this.closeStage();
            }
        };
        document.addEventListener('keydown', escape);
        document.addEventListener('fullscreenchange', fullscreenChanged);
        inject(DestroyRef).onDestroy(() => {
            this.stop();
            this.closeStage();
            document.removeEventListener('keydown', escape);
            document.removeEventListener('fullscreenchange', fullscreenChanged);
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

    clear(): void {
        if (this.clearFlash.active()) {
            return;
        }
        this.stop();
        this.closeStage();
        this.selected.set([]);
        this.session.set([]);
        this.customRate = '';
        this.elapsed.set(0);
        this.duration.set(0);
        this.cycles.set(1);
        this.lastGv.set(null);
        this.randomFallback.set(false);
        this.renderMessage.set('');
        this.wave = 0;
        this.fullscreenMessage.set('');
        const canvas = this.canvas()?.nativeElement;
        canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        this.status.set('Broadcast cleared.');
        this.clearFlash.start();
    }

    remaining(): number {
        return Math.max(0, Math.ceil(this.duration() - this.elapsed()));
    }

    startCustom(): void {
        const name = this.customRate.trim();
        if (name) {
            this.start(false, [{ name, originalIndex: -1, gv: this.targetGv() ?? 0, energeticScore: 0 }]);
        }
    }

    openStage(): void {
        const stage = this.stage()?.nativeElement;
        if (!stage || this.immersive()) {
            return;
        }
        this.previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        this.immersive.set(true);
        this.wakeLock.setEnabled(this.running());
        this.fullscreenMessage.set('');
        if (stage.requestFullscreen) {
            // Request during the initiating tap so mobile browsers preserve user activation.
            stage.requestFullscreen({ navigationUI: 'hide' }).catch(() => {
                if (this.immersive()) {
                    this.fullscreenMessage.set('Expanded view active. This browser keeps its system controls visible.');
                }
            });
        } else {
            this.fullscreenMessage.set('Expanded view active. This browser keeps its system controls visible.');
        }
        setTimeout(() => stage.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true }));
    }

    closeStage(): void {
        if (!this.immersive()) {
            return;
        }
        this.immersive.set(false);
        this.wakeLock.setEnabled(false);
        document.body.style.overflow = this.previousOverflow;
        if (document.fullscreenElement === this.stage()?.nativeElement) {
            document.exitFullscreen().catch(() => {});
        }
        this.stage()
            ?.nativeElement.closest('section')
            ?.querySelector<HTMLButtonElement>('.launch-actions button')
            ?.focus({ preventScroll: true });
    }

    start(all = false, custom?: AnalysisResult[]): void {
        if (this.running() || this.blocked() || document.hidden || this.targetGv() === null) {
            return;
        }
        const rates = custom ?? this.results().filter((rate) => all || this.selected().includes(rate.originalIndex));
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
        this.randomFallback.set(false);
        this.renderMessage.set('');
        this.started = performance.now();
        this.storageFailed = false;
        this.running.set(true);
        this.busyChange.emit(true);
        this.status.set('Broadcasting');
        this.openStage();
        this.wakeLock.setEnabled(this.immersive());
        const token = ++this.generation;
        this.spread = new SpreadDraws(
            Math.ceil(this.duration() * 30) * (this.resonanceEnabled ? rates.length : 0) + (this.checkEnabled ? 3 : 0),
            () => {
                if (token === this.generation) {
                    this.randomFallback.set(true);
                }
            },
        );
        this.tick(token);
    }

    stop(message = 'Broadcast stopped.'): void {
        this.wakeLock.setEnabled(false);
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
        const randomHits = () => resonanceHits(this.session().length, this.sessionMultiplier, unseededDraws);
        const sample = !this.resonanceEnabled
            ? Promise.resolve(this.session().map(() => false))
            : this.storageFailed
              ? Promise.resolve(randomHits())
              : this.hotbits
                    .broadcastResonance(
                        this.session().length,
                        this.sessionMultiplier,
                        () => {
                            if (token === this.generation) {
                                this.randomFallback.set(true);
                            }
                        },
                        this.spread,
                    )
                    .catch(() => {
                        // Broadcasting can continue even if browser storage becomes unavailable.
                        this.storageFailed = true;
                        if (token === this.generation) {
                            this.randomFallback.set(true);
                        }
                        return randomHits();
                    });
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
                if (!document.hidden) {
                    try {
                        this.draw();
                        this.renderMessage.set('');
                    } catch {
                        this.renderMessage.set('Visual rendering paused; broadcasting and resonance checks continue.');
                    }
                }
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
        const measurement = this.hotbits
            .targetMeasurement(() => {
                if (token === this.generation) {
                    this.randomFallback.set(true);
                }
            }, this.spread)
            .catch(() => {
                if (token === this.generation) {
                    this.randomFallback.set(true);
                }
                return calculateGv(unseededDraws);
            });
        measurement
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
                    this.spread = new SpreadDraws(300 * (this.resonanceEnabled ? this.session().length : 0) + 3, () =>
                        this.randomFallback.set(true),
                    );
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
        const bounds = canvas.getBoundingClientRect();
        const width = bounds.width || 640;
        const height = bounds.height || 360;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const pixelWidth = Math.round(width * pixelRatio);
        const pixelHeight = Math.round(height * pixelRatio);
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;
        }
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        // Visual randomness is independent of the stored hotbits used for resonance checks.
        const color = () => `hsla(${Math.random() * 360}, 90%, 65%, .65)`;
        context.fillStyle = 'rgba(9, 5, 28, .09)';
        context.fillRect(0, 0, width, height);
        context.strokeStyle = color();
        const cardRadius = Math.min(width, height) * 0.3;
        for (const radius of [cardRadius, Math.max(1, cardRadius - 10), Math.max(1, cardRadius - 20)]) {
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
