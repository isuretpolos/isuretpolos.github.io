import { CameraHotbits } from './camera-hotbits';

describe('Camera failure handling', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('keeps capture active and discards failed windows instead of stopping the camera', () => {
        let callback: () => void = () => {};
        let intensity = 0;
        const stop = vi.fn();
        const sink = vi.fn();
        const video = {
            play: () => Promise.resolve(),
            pause: vi.fn(),
            requestVideoFrameCallback: (next: () => void) => {
                callback = next;
                return 1;
            },
            cancelVideoFrameCallback: vi.fn(),
        };
        const canvas = {
            getContext: () => ({
                drawImage: vi.fn(),
                getImageData: () => ({ data: new Uint8ClampedArray(160 * 120 * 4).fill(++intensity) }),
            }),
        };
        vi.spyOn(document, 'createElement').mockImplementation(
            (tag) => (tag === 'video' ? video : canvas) as unknown as HTMLElement,
        );
        vi.stubGlobal('navigator', {
            mediaDevices: {
                getUserMedia: () =>
                    Promise.resolve({
                        getTracks: () => [{ stop, addEventListener: vi.fn() }],
                    }),
            },
        });
        const camera = new CameraHotbits();
        return camera.start(sink).then(() => {
            callback();
            callback();
            expect(camera.collecting()).toBe(true);
            expect(camera.health()).toContain('pending');
            for (let index = 0; index < 6; index++) {
                callback();
            }
            expect(camera.health()).toContain('rejected');
            expect(camera.collecting()).toBe(true);
            expect(stop).not.toHaveBeenCalled();
            expect(sink).not.toHaveBeenCalled();
            callback();
            expect(camera.health()).toContain('pending');
            camera.stop();
            expect(stop).toHaveBeenCalledOnce();
            expect(sink).not.toHaveBeenCalled();
        });
    });

    it('handles permission denial without leaving collection active', () => {
        vi.stubGlobal('navigator', {
            mediaDevices: {
                getUserMedia: () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')),
            },
        });
        const camera = new CameraHotbits();
        return expect(camera.start(() => {}))
            .rejects.toThrow('Permission denied')
            .then(() => {
                expect(camera.collecting()).toBe(false);
                expect(camera.status()).toContain('denied');
            });
    });

    it('releases late camera tracks when stopped during the permission request', () => {
        let granted!: (stream: MediaStream) => void;
        const stop = vi.fn();
        vi.stubGlobal('navigator', {
            mediaDevices: { getUserMedia: () => new Promise<MediaStream>((resolve) => (granted = resolve)) },
        });
        const camera = new CameraHotbits();
        const pending = camera.start(() => {});
        camera.stop();
        granted({ getTracks: () => [{ stop }] } as unknown as MediaStream);
        return pending.then(() => expect(stop).toHaveBeenCalledOnce());
    });
});
