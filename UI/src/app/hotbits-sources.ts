import { Component, DestroyRef, ElementRef, ViewChild, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HotbitsInventoryService } from './hotbits-inventory';
import { PairingPayload, parsePairing } from './hotbits-connection';

interface QrDetector {
    detect(video: HTMLVideoElement): Promise<{ rawValue: string }[]>;
}
@Component({
    selector: 'app-hotbits-sources',
    imports: [FormsModule],
    templateUrl: './hotbits-sources.html',
    styleUrl: './hotbits-sources.css',
})
export class HotbitsSources {
    readonly analysisBusy = input(false);
    formatBytes(bytes: number): string {
        return bytes < 1000 ? `${bytes} B` : `${(bytes / 1000).toFixed(1)} kB`;
    }
    readonly inventory = inject(HotbitsInventoryService);
    readonly connection = this.inventory.connection;
    readonly preview = signal<PairingPayload | null>(null);
    readonly error = signal('');
    readonly scanning = signal(false);
    readonly pairing = signal(false);
    payload = '';
    @ViewChild('qrVideo') video?: ElementRef<HTMLVideoElement>;
    private stream?: MediaStream;
    private timer?: ReturnType<typeof setTimeout>;
    private generation = 0;

    constructor() {
        const stop = () => {
            if (document.hidden) {
                this.stopScan();
            }
        };
        document.addEventListener('visibilitychange', stop);
        inject(DestroyRef).onDestroy(() => {
            this.stopScan();
            this.inventory.cancel();
            document.removeEventListener('visibilitychange', stop);
        });
    }
    validate(): void {
        this.stopScan();
        this.error.set('');
        this.preview.set(null);
        try {
            this.preview.set(parsePairing(this.payload));
        } catch (error) {
            this.fail(error);
        }
    }
    pair(): void {
        const payload = this.preview();
        if (!payload || this.pairing()) {
            return;
        }
        this.pairing.set(true);
        this.connection.cancel();
        this.connection
            .pair(payload)
            .then(() => {
                this.payload = '';
                this.preview.set(null);
                this.inventory.source = 'remote';
                return this.connection.refresh();
            })
            .catch((error) => this.fail(error))
            .finally(() => this.pairing.set(false));
    }
    refresh(): void {
        this.connection.refresh().catch((error) => this.fail(error));
    }
    download(): void {
        this.inventory.refill().catch((error) => this.fail(error));
    }
    disconnect(): void {
        this.stopScan();
        this.inventory.autoRefill = false;
        this.inventory.cancel();
        this.connection.disconnect();
        this.inventory.source = 'local';
    }
    scan(): void {
        this.stopScan();
        this.error.set('');
        const Detector = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => QrDetector })
            .BarcodeDetector;
        if (!Detector || !navigator.mediaDevices?.getUserMedia) {
            this.error.set('QR camera scanning is unsupported here. Paste the QR JSON below.');
            return;
        }
        const generation = this.generation;
        this.scanning.set(true);
        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
            .then((stream) => {
                if (generation !== this.generation) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }
                this.stream = stream;
                const video = this.video!.nativeElement;
                video.srcObject = stream;
                const detector = new Detector({ formats: ['qr_code'] });
                const detect = () => {
                    if (generation !== this.generation) {
                        return;
                    }
                    detector
                        .detect(video)
                        .then((codes) => {
                            if (generation !== this.generation) {
                                return;
                            }
                            if (codes.length) {
                                this.payload = codes[0].rawValue;
                                this.validate();
                            } else {
                                this.timer = setTimeout(detect, 300);
                            }
                        })
                        .catch((error) => {
                            this.stopScan();
                            this.fail(error);
                        });
                };
                return video.play().then(detect);
            })
            .catch((error) => {
                this.stopScan();
                this.fail(error);
            });
    }
    stopScan(): void {
        this.generation++;
        clearTimeout(this.timer);
        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = undefined;
        if (this.video) {
            this.video.nativeElement.srcObject = null;
        }
        this.scanning.set(false);
    }
    private fail(error: unknown): void {
        this.error.set(error instanceof Error ? error.message : 'Connection failed.');
    }
}
