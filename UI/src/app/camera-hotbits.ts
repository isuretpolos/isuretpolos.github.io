import { Injectable, signal } from '@angular/core';
import { BitConditioner } from './bit-conditioner';
import { FrameReadiness } from './frame-readiness';

@Injectable({ providedIn: 'root' })
export class CameraHotbits {
    readonly collecting = signal(false);
    readonly status = signal('Camera stopped');
    readonly rawSamples = signal(0);
    readonly usableBits = signal(0);
    readonly rejectedSamples = signal(0);
    readonly health = signal('Not assessed');
    private stream?: MediaStream;
    private video?: HTMLVideoElement;
    private frameId?: number;
    private generation = 0;
    private previous?: Uint8ClampedArray;
    private conditioner = new BitConditioner();
    private words: number[] = [];
    private sink?: (words: Uint32Array) => void;

    start(sink: (words: Uint32Array) => void): Promise<void> {
        if (!navigator.mediaDevices?.getUserMedia) {
            return Promise.reject(new Error('Camera capture needs a supported browser and HTTPS or localhost.'));
        }
        this.stop();
        const generation = ++this.generation;
        this.sink = sink;
        this.conditioner = new BitConditioner();
        this.previous = undefined;
        this.rawSamples.set(0);
        this.usableBits.set(0);
        this.rejectedSamples.set(0);
        this.health.set('Waiting for samples');
        this.status.set('Requesting camera permission…');
        return navigator.mediaDevices
            .getUserMedia({ video: { width: 160, height: 120 }, audio: false })
            .then((stream) => {
                if (generation !== this.generation) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }
                this.stream = stream;
                this.video = document.createElement('video');
                this.video.muted = true;
                this.video.playsInline = true;
                this.video.srcObject = stream;
                stream.getTracks().forEach((track) =>
                    track.addEventListener('ended', () => {
                        this.stop();
                        this.status.set('Camera access ended. Collection stopped.');
                    }),
                );
                return this.video.play().then(() => {
                    if (generation !== this.generation) {
                        return;
                    }
                    this.collecting.set(true);
                    this.status.set('Collecting experimental webcam randomness');
                    const canvas = document.createElement('canvas');
                    canvas.width = 160;
                    canvas.height = 120;
                    const context = canvas.getContext('2d', { willReadFrequently: true });
                    if (!context || !this.video?.requestVideoFrameCallback) {
                        throw new Error('This browser does not support frame-based camera collection.');
                    }
                    const readiness = new FrameReadiness();
                    this.status.set(readiness.status);
                    this.health.set('Waiting for frame differences · tests not started');
                    const frame = () => {
                        if (!this.collecting() || generation !== this.generation || !this.video) {
                            return;
                        }
                        try {
                            context.drawImage(this.video, 0, 0, 160, 120);
                            const pixels = context.getImageData(0, 0, 160, 120).data;
                            if (!readiness.accept(pixels)) {
                                this.previous = pixels;
                                this.status.set(readiness.status);
                                this.frameId = this.video.requestVideoFrameCallback(frame);
                                return;
                            }
                            if (this.previous) {
                                let brighter = 0;
                                let darker = 0;
                                for (let index = 0; index < pixels.length; index += 64) {
                                    const difference = pixels[index] - this.previous[index];
                                    brighter += difference > 0 ? 1 : 0;
                                    darker += difference < 0 ? 1 : 0;
                                }
                                const changed = brighter + darker;
                                const fraction = changed ? brighter / changed : 0.5;
                                if (changed && (fraction <= 0.2 || fraction >= 0.8)) {
                                    // Coherent scene/exposure changes are excluded without discarding prior samples.
                                    this.previous = pixels;
                                    this.health.set('Scene or exposure change · skipping this frame pair');
                                    this.status.set('Collecting · keeping progress through camera movement');
                                    this.frameId = this.video.requestVideoFrameCallback(frame);
                                    return;
                                }
                                const rawBefore = this.conditioner.raw;
                                const usableBefore = this.conditioner.usable;
                                // Sparse red-channel samples reduce adjacent-pixel dependence, without proving independence.
                                for (let index = 0; index < pixels.length; index += 64) {
                                    const difference = pixels[index] - this.previous[index];
                                    if (difference === 0) {
                                        this.rejectedSamples.update((count) => count + 1);
                                        continue;
                                    }
                                    const word = this.conditioner.accept(difference > 0 ? 1 : 0);
                                    if (word !== undefined) {
                                        this.words.push(word);
                                    }
                                }
                                this.rawSamples.update((count) => count + this.conditioner.raw - rawBefore);
                                this.usableBits.update((count) => count + this.conditioner.usable - usableBefore);
                                const assessment = this.conditioner.assessment();
                                this.health.set(
                                    assessment === 'passed'
                                        ? 'Basic checks passed · entropy unverified'
                                        : assessment === 'pending'
                                          ? 'Gathering samples · assessment pending'
                                          : 'Sample window rejected · retrying automatically',
                                );
                                if (assessment === 'failed') {
                                    // Reject this window, but keep capture running through exposure/lighting transients.
                                    this.words = [];
                                    this.conditioner = new BitConditioner();
                                    this.status.set('Collecting · rejected a sample window; gathering fresh samples');
                                } else {
                                    this.status.set('Collecting experimental webcam randomness');
                                }
                                if (assessment === 'passed') {
                                    this.flush();
                                    this.conditioner = new BitConditioner();
                                }
                            }
                            this.previous = pixels;
                            this.frameId = this.video.requestVideoFrameCallback(frame);
                        } catch {
                            this.stop();
                            this.status.set('Camera frame could not be read. Collection stopped.');
                        }
                    };
                    this.frameId = this.video.requestVideoFrameCallback(frame);
                });
            })
            .catch((error) => {
                if (generation === this.generation) {
                    this.stop();
                    this.status.set('Camera unavailable or permission denied');
                }
                throw error;
            });
    }

    stop(): void {
        ++this.generation;
        this.collecting.set(false);
        if (this.frameId !== undefined && this.video) {
            this.video.cancelVideoFrameCallback(this.frameId);
        }
        this.stream?.getTracks().forEach((track) => track.stop());
        if (this.video) {
            this.video.pause();
            this.video.srcObject = null;
        }
        this.stream = undefined;
        this.video = undefined;
        this.frameId = undefined;
        if (this.conditioner.healthy()) {
            this.flush();
        } else {
            this.words = [];
        }
        this.status.set('Camera stopped');
    }

    private flush(): void {
        if (this.words.length && this.conditioner.healthy()) {
            const batch = new Uint32Array(this.words);
            this.words = [];
            this.sink?.(batch);
        }
    }
}
