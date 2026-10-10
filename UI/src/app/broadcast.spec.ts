import { broadcastDuration, resonanceHits } from './broadcast';

describe('Broadcast rules from the Java component', () => {
    it('uses the entered seconds unless target GV is lower, with delta enabled', () => {
        expect(broadcastDuration(1000, 700, true)).toBe(300);
        expect(broadcastDuration(60, 700, true)).toBe(60);
        expect(broadcastDuration(700, 700, true)).toBe(700);
        expect(broadcastDuration(1000, 700, false)).toBe(1000);
        expect(broadcastDuration(60, 0, true)).toBe(60);
        expect(() => broadcastDuration(0, 700, true)).toThrow();
    });

    it('checks each selected rate using the Java resonance probability and multiplier', () => {
        const values = [6764, 6765, 0];
        const maxima: number[] = [];
        const hits = resonanceHits(3, 1, {
            integer: (maximum) => {
                maxima.push(maximum);
                return values.shift()!;
            },
        });
        expect(hits).toEqual([false, true, false]);
        expect(maxima).toEqual([6765, 6765, 6765]);
    });
});
