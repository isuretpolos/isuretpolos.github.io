import { CameraHotbits } from './camera-hotbits';

describe('Camera failure handling', () => {
    afterEach(() => vi.unstubAllGlobals());

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
