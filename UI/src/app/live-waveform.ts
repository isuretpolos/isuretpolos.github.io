import { afterNextRender, Component, DestroyRef, ElementRef, inject, NgZone, viewChild, effect } from '@angular/core';
import { LiveSession } from './live-session';

@Component({
    selector: 'app-live-waveform',
    template:
        '<canvas #chart role="img" aria-label="Experimental GV waveform over the last 60 seconds, with a centered zero line"></canvas>',
    styles: [':host {display:block; min-height:220px; height:100%;} canvas {display:block; width:100%; height:100%;}'],
})
export class LiveWaveform {
    private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('chart');
    private readonly session = inject(LiveSession);
    private readonly zone = inject(NgZone);
    private frame?: number;
    private currentScale = 1000;
    private ready = false;

    constructor() {
        const destroy = inject(DestroyRef);
        let observer: ResizeObserver | undefined;
        afterNextRender(() => {
            this.ready = true;
            if (typeof ResizeObserver !== 'undefined') {
                observer = new ResizeObserver(() => this.requestDraw());
                observer.observe(this.canvas()!.nativeElement);
            }
            this.requestDraw();
        });
        effect(() => {
            this.session.readings();
            this.session.state();
            this.session.anomalies();
            this.requestDraw();
        });
        destroy.onDestroy(() => {
            if (this.frame !== undefined) {
                cancelAnimationFrame(this.frame);
            }
            observer?.disconnect();
        });
    }

    private requestDraw(): void {
        if (!this.ready || this.frame !== undefined) {
            return;
        }
        this.zone.runOutsideAngular(() => {
            this.frame = requestAnimationFrame(() => {
                this.frame = undefined;
                this.draw();
                if (this.session.state() === 'running') {
                    this.requestDraw();
                }
            });
        });
    }

    private draw(): void {
        const canvas = this.canvas()!.nativeElement;
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (!width || !height) {
            return;
        }
        const ratio = window.devicePixelRatio || 1;
        if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
            canvas.width = Math.round(width * ratio);
            canvas.height = Math.round(height * ratio);
        }
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.clearRect(0, 0, width, height);
        const targetScale = this.session.scale();
        this.currentScale = window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? targetScale
            : this.currentScale + (targetScale - this.currentScale) * 0.15;
        if (Math.abs(this.currentScale - targetScale) < 1) {
            this.currentScale = targetScale;
        }
        const left = 56;
        const right = width - 10;
        const top = 18;
        const bottom = height - 26;
        const middle = (top + bottom) / 2;
        context.strokeStyle = '#41538A50';
        context.lineWidth = 1;
        for (let index = 0; index <= 8; index++) {
            const y = top + ((bottom - top) * index) / 8;
            context.beginPath();
            context.moveTo(left, y);
            context.lineTo(right, y);
            context.stroke();
        }
        for (let index = 0; index <= 12; index++) {
            const x = left + ((right - left) * index) / 12;
            context.beginPath();
            context.moveTo(x, top);
            context.lineTo(x, bottom);
            context.stroke();
        }
        context.strokeStyle = '#A9B9D580';
        context.setLineDash([5, 5]);
        context.beginPath();
        context.moveTo(left, middle);
        context.lineTo(right, middle);
        context.stroke();
        context.setLineDash([]);
        context.fillStyle = '#A9B9D5';
        context.font = '12px system-ui';
        context.fillText('+' + targetScale, 2, top + 10);
        context.fillText('0', 32, middle - 5);
        context.fillText('−' + targetScale, 2, bottom);
        context.fillText('−60s', left, height - 5);
        context.fillText('now', right - 25, height - 5);
        const now = this.session.elapsed();
        const readings = this.session.readings().filter((reading) => reading.elapsedMs >= now - 60000);
        context.strokeStyle = '#42E6EC';
        context.lineWidth = 2;
        context.lineJoin = 'round';
        context.beginPath();
        let lastTime: number | undefined;
        for (const reading of readings) {
            const x = right - ((now - reading.elapsedMs) / 60000) * (right - left);
            const y = middle - ((reading.gv / this.currentScale) * (bottom - top)) / 2;
            if (lastTime === undefined || reading.elapsedMs - lastTime > 12000) {
                context.moveTo(x, y);
            } else {
                context.lineTo(x, y);
            }
            lastTime = reading.elapsedMs;
        }
        context.stroke();
        // Draw red bounds around complete qualifying runs, including the first readings.
        context.save();
        context.beginPath();
        context.rect(left, top, right - left, bottom - top);
        context.clip();
        context.strokeStyle = '#FF5252';
        context.fillStyle = '#FF525214';
        context.lineWidth = 1;
        for (const run of this.session.anomalies()) {
            const first = run.points[0];
            const last = run.points.at(-1)!;
            if (last.elapsedMs < now - 60000 || first.elapsedMs > now) {
                continue;
            }
            const x = right - ((now - first.elapsedMs) / 60000) * (right - left);
            const endX = right - ((now - last.elapsedMs) / 60000) * (right - left);
            const values = run.points.map((point) => point.gv);
            const y = middle - ((Math.max(...values) / this.currentScale) * (bottom - top)) / 2 - 8;
            const endY = middle - ((Math.min(...values) / this.currentScale) * (bottom - top)) / 2 + 8;
            context.fillRect(x - 5, y, endX - x + 10, endY - y);
            context.strokeRect(x - 5, y, endX - x + 10, endY - y);
        }
        context.restore();
    }
}
