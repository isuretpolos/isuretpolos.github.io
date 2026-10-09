import { Component, DestroyRef, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HotbitStore } from './hotbit-store';
import { drawPhotoMarkers, PhotoCell } from './photo-grid';

interface SessionPhoto {
    id: number;
    name: string;
    url: string;
    image: HTMLImageElement;
}

@Component({
    selector: 'app-photo-analysis',
    imports: [FormsModule],
    templateUrl: './photo-analysis.html',
    styleUrl: './photo-analysis.css',
})
export class PhotoAnalysis {
    readonly mode = input<'simple' | 'advanced'>('simple');
    readonly available = input(0);
    readonly blocked = input(false);
    readonly busyChange = output<boolean>();
    readonly countsChanged = output<void>();
    private readonly store = inject(HotbitStore);
    private readonly video = viewChild<ElementRef<HTMLVideoElement>>('cameraVideo');
    readonly photos = signal<SessionPhoto[]>([]);
    readonly selected = signal<SessionPhoto | undefined>(undefined);
    readonly analyzing = signal(false);
    readonly loading = signal(false);
    readonly cameraOpen = signal(false);
    readonly error = signal('');
    readonly markers = signal<PhotoCell[]>([]);
    readonly resultUrl = signal('');
    readonly resultName = signal('');
    readonly resultGrid = signal(50);
    readonly gridOptions = [50, 25, 16];
    grid = 50;
    selectedId = 0;
    private nextId = 1;
    private stream?: MediaStream;
    private disposed = false;
    private cameraRequest = 0;

    constructor() {
        const hidden = () => {
            if (document.hidden) {
                this.stopCamera();
            }
        };
        document.addEventListener('visibilitychange', hidden);
        inject(DestroyRef).onDestroy(() => {
            this.disposed = true;
            this.stopCamera();
            document.removeEventListener('visibilitychange', hidden);
            this.photos().forEach((photo) => URL.revokeObjectURL(photo.url));
            if (this.resultUrl()) {
                URL.revokeObjectURL(this.resultUrl());
            }
        });
    }

    minimum(): number {
        return this.grid * this.grid * 3;
    }

    selectPhoto(): void {
        if (!this.analyzing() && !this.loading()) {
            this.selected.set(this.photos().find((photo) => photo.id === Number(this.selectedId)));
        }
    }

    upload(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file || this.blocked() || this.analyzing() || this.loading()) {
            return;
        }
        if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
            this.error.set('Choose a supported photo such as PNG, JPEG or WebP.');
            return;
        }
        this.loadPhoto(file, file.name);
    }

    private loadPhoto(blob: Blob, name: string): void {
        this.loading.set(true);
        this.busyChange.emit(true);
        this.error.set('');
        const url = URL.createObjectURL(blob);
        const image = new Image();
        image.src = url;
        image
            .decode()
            .then(() => {
                if (this.disposed) {
                    URL.revokeObjectURL(url);
                    return;
                }
                if (
                    !image.naturalWidth ||
                    !image.naturalHeight ||
                    image.naturalWidth * image.naturalHeight > 40000000
                ) {
                    throw new Error('This photo is too large. Choose an image of at most 40 megapixels.');
                }
                const photo = { id: this.nextId++, name, url, image };
                const photos = [...this.photos(), photo];
                if (photos.length > 5) {
                    URL.revokeObjectURL(photos.shift()!.url);
                }
                this.photos.set(photos);
                this.selected.set(photo);
                this.selectedId = photo.id;
            })
            .catch((error) => {
                URL.revokeObjectURL(url);
                this.error.set(
                    error instanceof Error ? `Could not load photo: ${error.message}` : 'Could not decode this photo.',
                );
            })
            .finally(() => {
                this.loading.set(false);
                this.busyChange.emit(this.cameraOpen() || this.analyzing());
            });
    }

    startCamera(): void {
        if (this.blocked() || this.analyzing() || this.loading() || this.cameraOpen()) {
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            this.error.set('Camera access needs HTTPS or localhost. You can also upload a photo.');
            return;
        }
        const request = ++this.cameraRequest;
        this.cameraOpen.set(true);
        this.busyChange.emit(true);
        this.error.set('');
        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
            .then((stream) => {
                if (request !== this.cameraRequest || this.disposed) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }
                this.stream = stream;
                stream.getTracks().forEach((track) => track.addEventListener('ended', () => this.stopCamera()));
                const video = this.video()!.nativeElement;
                video.srcObject = stream;
                return video.play();
            })
            .catch(() => {
                if (request !== this.cameraRequest || this.disposed) {
                    return;
                }
                this.stopCamera();
                this.error.set(
                    'Camera unavailable. Enable camera permission, or upload a photo. If the camera is in use for Hotbits, stop that collection first.',
                );
            });
    }

    capturePhoto(): void {
        const video = this.video()?.nativeElement;
        if (!video?.videoWidth || !video.videoHeight || this.loading()) {
            return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            this.error.set('Canvas rendering is unavailable.');
            return;
        }
        context.drawImage(video, 0, 0);
        this.loading.set(true);
        canvas.toBlob((blob) => {
            if (this.disposed) {
                return;
            }
            this.stopCamera();
            this.loading.set(false);
            if (blob) {
                this.loadPhoto(blob, 'Camera photo');
            } else {
                this.error.set('Could not capture this photo.');
                this.busyChange.emit(false);
            }
        }, 'image/png');
    }

    stopCamera(): void {
        ++this.cameraRequest;
        this.stream?.getTracks().forEach((track) => track.stop());
        this.stream = undefined;
        const video = this.video()?.nativeElement;
        if (video?.srcObject) {
            video.pause();
            video.srcObject = null;
        }
        this.cameraOpen.set(false);
        this.busyChange.emit(this.analyzing() || this.loading());
    }

    analyze(): void {
        const photo = this.selected();
        if (
            !photo ||
            this.blocked() ||
            this.analyzing() ||
            this.loading() ||
            this.cameraOpen() ||
            this.available() < this.minimum()
        ) {
            return;
        }
        const grid = this.grid;
        const canvas = document.createElement('canvas');
        canvas.width = photo.image.naturalWidth;
        canvas.height = photo.image.naturalHeight;
        const context = canvas.getContext('2d');
        if (!context) {
            this.error.set('Canvas rendering is unavailable.');
            return;
        }
        context.drawImage(photo.image, 0, 0);
        this.analyzing.set(true);
        this.busyChange.emit(true);
        this.error.set('');
        this.store
            .analyzePhoto(canvas.width, canvas.height, grid)
            .then((markers) => {
                if (this.disposed) {
                    return;
                }
                drawPhotoMarkers(context, markers);
                return new Promise<void>((resolve, reject) =>
                    canvas.toBlob((blob) => {
                        if (this.disposed) {
                            resolve();
                            return;
                        }
                        if (!blob) {
                            reject(new Error('Could not render the result PNG.'));
                            return;
                        }
                        if (this.resultUrl()) {
                            URL.revokeObjectURL(this.resultUrl());
                        }
                        this.resultUrl.set(URL.createObjectURL(blob));
                        this.resultName.set(photo.name);
                        this.resultGrid.set(grid);
                        this.markers.set(markers);
                        resolve();
                    }, 'image/png'),
                );
            })
            .catch((error) => this.error.set(error instanceof Error ? error.message : 'Photo analysis failed.'))
            .finally(() => {
                this.analyzing.set(false);
                this.busyChange.emit(this.loading() || this.cameraOpen());
                this.countsChanged.emit();
            });
    }

    exportResult(): void {
        if (!this.resultUrl()) {
            return;
        }
        const link = document.createElement('a');
        link.href = this.resultUrl();
        link.download = 'radionics-photo-analysis.png';
        link.click();
    }
}
