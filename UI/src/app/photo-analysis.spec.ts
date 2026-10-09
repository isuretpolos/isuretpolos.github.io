import { analyzePhotoGrid } from './photo-grid';
import { TestBed } from '@angular/core/testing';
import { PhotoAnalysis } from './photo-analysis';
import { HotbitStore } from './hotbit-store';

describe('Photo Analysis UI', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [PhotoAnalysis] }));
    afterEach(() => {
        TestBed.resetTestingModule();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('defaults to 2500 cells, supports all grid sizes and blocks incomplete analysis', () => {
        const fixture = TestBed.createComponent(PhotoAnalysis);
        fixture.detectChanges();
        const photo = fixture.componentInstance;
        const analyze = vi.spyOn(TestBed.inject(HotbitStore), 'analyzePhoto');
        expect(photo.minimum()).toBe(7500);
        photo.grid = 25;
        expect(photo.minimum()).toBe(1875);
        photo.grid = 16;
        expect(photo.minimum()).toBe(768);
        photo.analyze();
        expect(analyze).not.toHaveBeenCalled();
    });

    it('releases tracks if permission resolves after the photo camera is cancelled', () => {
        let resolveStream!: (stream: MediaStream) => void;
        const stop = vi.fn();
        vi.stubGlobal('navigator', {
            mediaDevices: { getUserMedia: () => new Promise<MediaStream>((resolve) => (resolveStream = resolve)) },
        });
        const photo = TestBed.createComponent(PhotoAnalysis).componentInstance;
        photo.startCamera();
        photo.stopCamera();
        resolveStream({ getTracks: () => [{ stop }] } as unknown as MediaStream);
        return vi.waitFor(() => expect(stop).toHaveBeenCalledOnce());
    });

    it('reports camera denial and resets busy state', () => {
        vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: () => Promise.reject(new Error('Denied')) } });
        const photo = TestBed.createComponent(PhotoAnalysis).componentInstance;
        photo.startCamera();
        return vi.waitFor(() => {
            expect(photo.error()).toContain('permission');
            expect(photo.cameraOpen()).toBe(false);
        });
    });

    it('renders at the original dimensions, marks the result and refreshes shared counts', () => {
        const fixture = TestBed.createComponent(PhotoAnalysis);
        fixture.componentRef.setInput('available', 1000);
        fixture.detectChanges();
        const photo = fixture.componentInstance;
        photo.grid = 16;
        photo.selected.set({
            id: 1,
            name: 'Landscape',
            url: 'blob:source',
            image: { naturalWidth: 800, naturalHeight: 400 } as HTMLImageElement,
        });
        const markers = analyzePhotoGrid(800, 400, 16, { integer: () => 0 });
        const analyze = vi.spyOn(TestBed.inject(HotbitStore), 'analyzePhoto').mockResolvedValue(markers);
        const context = {
            drawImage: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
        };
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
            context as unknown as CanvasRenderingContext2D,
        );
        let dimensions: number[] = [];
        vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
            this: HTMLCanvasElement,
            callback,
        ) {
            dimensions = [this.width, this.height];
            callback(new Blob(['result'], { type: 'image/png' }));
        });
        vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:result'), revokeObjectURL: vi.fn() });
        const counts = vi.spyOn(photo.countsChanged, 'emit');
        photo.analyze();
        expect(photo.analyzing()).toBe(true);
        return vi
            .waitFor(() => {
                expect(photo.resultUrl()).toBe('blob:result');
                expect(counts).toHaveBeenCalledOnce();
                expect(photo.analyzing()).toBe(false);
            })
            .then(() => {
                expect(analyze).toHaveBeenCalledWith(800, 400, 16);
                expect(dimensions).toEqual([800, 400]);
                expect(context.stroke).toHaveBeenCalledTimes(3);
                expect(photo.markers()).toEqual(markers);
            });
    });

    it('keeps uploaded images in a reusable session gallery and releases their URLs', () => {
        vi.stubGlobal('URL', {
            createObjectURL: vi.fn().mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second'),
            revokeObjectURL: vi.fn(),
        });
        vi.stubGlobal(
            'Image',
            class {
                src = '';
                naturalWidth = 800;
                naturalHeight = 400;
                decode() {
                    return Promise.resolve();
                }
            },
        );
        const fixture = TestBed.createComponent(PhotoAnalysis);
        const photo = fixture.componentInstance;
        const upload = (name: string) =>
            photo.upload({
                target: { files: [new File(['image'], name, { type: 'image/png' })], value: name },
            } as unknown as Event);
        upload('first.png');
        return vi
            .waitFor(() => expect(photo.photos().length).toBe(1))
            .then(() => {
                upload('second.png');
                return vi.waitFor(() => expect(photo.photos().length).toBe(2));
            })
            .then(() => {
                photo.selectedId = photo.photos()[0].id;
                photo.selectPhoto();
                expect(photo.selected()?.name).toBe('first.png');
                fixture.destroy();
                expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:first');
                expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:second');
            });
    });

    it('rejects unsupported files locally', () => {
        const photo = TestBed.createComponent(PhotoAnalysis).componentInstance;
        photo.upload({
            target: { files: [new File(['hello'], 'file.txt', { type: 'text/plain' })], value: 'file.txt' },
        } as unknown as Event);
        expect(photo.error()).toContain('supported photo');
        expect(photo.photos().length).toBe(0);
    });
});
