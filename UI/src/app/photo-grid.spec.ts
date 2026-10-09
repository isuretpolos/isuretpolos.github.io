import { analyzePhotoGrid, drawPhotoMarkers } from './photo-grid';
import { HotbitDraws } from './analysis';

describe('Photo grid analysis', () => {
    it.each([50, 25, 16])('evaluates every cell in a %i square grid and preserves rectangular bounds', (grid) => {
        const draws = vi.fn((maximum: number) => 0);
        const cells = analyzePhotoGrid(1234, 777, grid, { integer: draws });
        expect(draws).toHaveBeenCalledTimes(grid * grid * 3);
        expect(draws.mock.calls.every(([maximum]) => maximum === 1000)).toBe(true);
        expect(cells.map((cell) => cell.index)).toEqual([0, 1, 2]);
        expect(cells[0].centerX).toBeCloseTo(1234 / grid / 2);
        expect(cells[0].centerY).toBeCloseTo(777 / grid / 2);
        expect(cells[2].right).toBeCloseTo((3 * 1234) / grid);
    });

    it('ranks by extended GV, including cells on the last row and column', () => {
        const words = new Uint32Array(16 * 16 * 3 + 4);
        const values: number[] = [];
        for (let index = 0; index < 256; index++) {
            values.push(index === 255 ? 977 : index === 254 ? 969 : index === 253 ? 888 : 0, 0, 0);
            if (index === 254) {
                values.push(70);
            }
            if (index === 255) {
                values.push(97, 96, 10);
            }
        }
        words.set(values);
        const cells = analyzePhotoGrid(800, 400, 16, new HotbitDraws(words));
        expect(cells.map((cell) => cell.gv)).toEqual([1180, 1039, 888]);
        expect(cells[0].column).toBe(16);
        expect(cells[0].row).toBe(16);
        expect(cells[0].right).toBe(800);
        expect(cells[0].bottom).toBe(400);
        expect(cells[0].centerX).toBe(775);
        expect(cells[0].centerY).toBe(387.5);
    });

    it('rejects bad geometry and insufficient hotbits without partial rankings', () => {
        expect(() => analyzePhotoGrid(0, 100, 50, { integer: () => 0 })).toThrow();
        expect(() => analyzePhotoGrid(100, 100, 0, { integer: () => 0 })).toThrow();
        expect(() => analyzePhotoGrid(100, 100, 16, new HotbitDraws(new Uint32Array(767)))).toThrow('Insufficient');
    });

    it('draws three precise small crosses and restores the canvas drawing state', () => {
        const cells = analyzePhotoGrid(800, 400, 16, { integer: () => 0 });
        const context = {
            save: vi.fn(),
            restore: vi.fn(),
            beginPath: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            strokeStyle: '',
            lineCap: '',
            lineWidth: 0,
        };
        drawPhotoMarkers(context as unknown as CanvasRenderingContext2D, cells);
        expect(context.strokeStyle).toBe('#ff0000');
        expect(context.stroke).toHaveBeenCalledTimes(3);
        expect(context.moveTo).toHaveBeenNthCalledWith(1, 25 - 4.5, 12.5);
        expect(context.lineTo).toHaveBeenNthCalledWith(1, 25 + 4.5, 12.5);
        expect(context.restore).toHaveBeenCalledOnce();
    });
});
