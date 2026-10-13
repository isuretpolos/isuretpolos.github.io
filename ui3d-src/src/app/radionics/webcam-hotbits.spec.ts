import {afterEach, describe, expect, it, vi} from 'vitest';
import {WebcamHotbits} from './webcam-hotbits';

function mockVideo(): {play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn>; srcObject: unknown; readyState: number} {
    return {play: vi.fn(() => Promise.resolve()), pause: vi.fn(), srcObject: null, readyState: 2};
}

describe('webcam lifecycle', () => {
    afterEach(() => {vi.unstubAllGlobals(); vi.useRealTimers();});

    it('reports denied permission and releases resources', () => {
        const video = mockVideo();
        vi.stubGlobal('document', {createElement: () => video});
        vi.stubGlobal('navigator', {mediaDevices: {getUserMedia: () => Promise.reject(new Error('Permission denied'))}});
        const provider = new WebcamHotbits();
        return expect(provider.start()).rejects.toThrow('Permission denied').then(() => {
            expect(video.srcObject).toBeNull();
            expect(provider.available).toBe(0);
            expect(provider.take()).toBeUndefined();
        });
    });

    it('releases a late permission result after cancellation', () => {
        const video = mockVideo();
        const stop = vi.fn();
        let grant!: (stream: MediaStream) => void;
        vi.stubGlobal('document', {createElement: () => video});
        vi.stubGlobal('navigator', {mediaDevices: {getUserMedia: () => new Promise<MediaStream>(resolve => grant = resolve)}});
        const provider = new WebcamHotbits();
        const pending = provider.start();
        provider.stop();
        grant({getTracks: () => [{stop}]} as unknown as MediaStream);
        return expect(pending).rejects.toThrow('cancelled').then(() => expect(stop).toHaveBeenCalledOnce());
    });

    it('stops tracks and sampling after successful start', () => {
        vi.useFakeTimers();
        const video = mockVideo();
        const stop = vi.fn();
        const draw = vi.fn();
        const context = {drawImage: draw, getImageData: () => ({data: new Uint8ClampedArray(64 * 64 * 4)})};
        vi.stubGlobal('document', {hidden: false, createElement: (type: string) => type === 'video' ? video : {getContext: () => context}});
        vi.stubGlobal('navigator', {mediaDevices: {getUserMedia: () => Promise.resolve({getTracks: () => [{stop}]})}});
        const provider = new WebcamHotbits();
        return provider.start().then(() => {
            vi.advanceTimersByTime(250);
            expect(draw).toHaveBeenCalledTimes(2);
            provider.stop();
            vi.advanceTimersByTime(500);
            expect(draw).toHaveBeenCalledTimes(2);
            expect(stop).toHaveBeenCalledOnce();
            expect(video.srcObject).toBeNull();
        });
    });
});
