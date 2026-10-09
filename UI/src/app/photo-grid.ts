import { calculateGv } from './analysis';

export interface PhotoCell {
    index: number;
    column: number;
    row: number;
    gv: number;
    left: number;
    top: number;
    right: number;
    bottom: number;
    centerX: number;
    centerY: number;
}

export function analyzePhotoGrid(
    width: number,
    height: number,
    grid: number,
    draws: { integer: (maximum: number) => number },
): PhotoCell[] {
    if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0 ||
        !Number.isInteger(grid) ||
        grid < 2 ||
        grid > 256
    ) {
        throw new Error('Invalid image dimensions or grid size.');
    }
    const cells: PhotoCell[] = [];
    for (let row = 0; row < grid; row++) {
        for (let column = 0; column < grid; column++) {
            cells.push({
                index: row * grid + column,
                column: column + 1,
                row: row + 1,
                gv: calculateGv(draws),
                left: (column * width) / grid,
                top: (row * height) / grid,
                right: ((column + 1) * width) / grid,
                bottom: ((row + 1) * height) / grid,
                centerX: ((column + 0.5) * width) / grid,
                centerY: ((row + 0.5) * height) / grid,
            });
        }
    }
    cells.sort((left, right) => right.gv - left.gv || left.index - right.index);
    return cells.slice(0, 3);
}

export function drawPhotoMarkers(context: CanvasRenderingContext2D, cells: PhotoCell[]): void {
    context.save();
    context.strokeStyle = '#ff0000';
    context.lineCap = 'round';
    for (const cell of cells) {
        const size = Math.min(cell.right - cell.left, cell.bottom - cell.top);
        const radius = size * 0.18;
        context.lineWidth = Math.max(0.5, size * 0.04);
        context.beginPath();
        context.moveTo(cell.centerX - radius, cell.centerY);
        context.lineTo(cell.centerX + radius, cell.centerY);
        context.moveTo(cell.centerX, cell.centerY - radius);
        context.lineTo(cell.centerX, cell.centerY + radius);
        context.stroke();
    }
    context.restore();
}
