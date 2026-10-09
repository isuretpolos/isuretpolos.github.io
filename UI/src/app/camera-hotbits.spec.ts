import { CameraHotbits } from './camera-hotbits';

describe('Camera failure handling', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('skips movement without losing progress and saves accepted windows during capture', () => {
        let callback: () => void = () => {};
        let intensity = 0;
        let movement = true;
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
                getImageData: () => {
                    intensity++;
                    const data = new Uint8ClampedArray(160 * 120 * 4);
                    for (let index = 0; index < data.length; index += 64) {
                        const positive = (index / 64) % 4 === 1 || (index / 64) % 4 === 2;
                        data[index] = movement ? intensity : 100 + (intensity % 2 ? (positive ? 1 : -1) : 0);
                    }
                    return { data };
                },
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
            for (let index = 0; index < 16; index++) {
                callback();
            }
            expect(camera.rawSamples()).toBe(0);
            expect(camera.usableBits()).toBe(0);
            expect(camera.status()).toContain('Waiting for differences');
            callback();
            callback();
            expect(camera.collecting()).toBe(true);
            expect(camera.health()).toContain('skipping');
            expect(camera.rawSamples()).toBe(0);
            movement = false;
            for (let index = 0; index < 10; index++) {
                callback();
            }
            expect(sink).toHaveBeenCalled();
            const stored = sink.mock.calls.reduce((count, [words]) => count + words.length, 0);
            const raw = camera.rawSamples();
            movement = true;
            callback();
            callback();
            expect(camera.collecting()).toBe(true);
            expect(camera.rawSamples()).toBeGreaterThanOrEqual(raw);
            expect(sink.mock.calls.reduce((count, [words]) => count + words.length, 0)).toBeGreaterThanOrEqual(stored);
            expect(stop).not.toHaveBeenCalled();
            camera.stop();
            expect(stop).toHaveBeenCalledOnce();
            expect(sink).toHaveBeenCalled();
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
