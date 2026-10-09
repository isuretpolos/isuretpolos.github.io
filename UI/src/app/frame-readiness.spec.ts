import { FrameReadiness } from './frame-readiness';

const pixels = (intensity: number) => new Uint8ClampedArray(128).fill(intensity);

describe('Camera frame readiness', () => {
    it('discards startup and identical frames before beginning bias-test sampling', () => {
        const readiness = new FrameReadiness();
        for (let index = 0; index < 15; index++) {
            expect(readiness.accept(pixels(index))).toBe(false);
        }
        expect(readiness.status).toContain('Skipping');
        for (let index = 0; index < 100; index++) {
            expect(readiness.accept(pixels(20))).toBe(false);
        }
        expect(readiness.status).toContain('Waiting for differences');
        expect(readiness.accept(pixels(21))).toBe(false);
        expect(readiness.status).toContain('differences detected');
        expect(readiness.accept(pixels(22))).toBe(true);
    });

    it('starts each new capture with fresh warmup state', () => {
        expect(new FrameReadiness().accept(pixels(100))).toBe(false);
    });
});
