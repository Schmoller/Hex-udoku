import { HexCoordinate, type HexDirection } from '../coordinates';

/**
 * HexGridMetrics interface defines the metrics for rendering hexagonal grids.
 * This stores the dimensions of a hexagon and the spacing between them.
 */
export interface HexGridMetrics {
    innerSize: number;
    cellWidth: number;
    cellHeight: number;
    horizontalSpacing: number;
    verticalSpacing: number;
}

/**
 * Converts a hexagonal coordinate to canvas coordinates.
 * This function assumes a flat-top hexagon orientation.
 *
 * @param coordinate The hexagonal coordinate to convert to canvas coordinates.
 * @param metrics The precalculated metrics for the hexagonal grid.
 * @returns The canvas coordinates (x, y) for the center of the hexagon.
 */
export function hexCoordinateToCanvas(coordinate: HexCoordinate, metrics: HexGridMetrics) {
    // Flat top orientation
    const x = coordinate.q * metrics.horizontalSpacing + metrics.cellWidth / 2;
    const y = (coordinate.r + coordinate.q / 2) * metrics.verticalSpacing + metrics.cellHeight / 2;

    return { x, y };
}

/**
 * Converts canvas coordinates to a hexagonal coordinate.
 * This function assumes a flat-top hexagon orientation.
 *
 * @param x The x-coordinate in canvas space.
 * @param y The y-coordinate in canvas space.
 * @param metrics The precalculated metrics for the hexagonal grid.
 * @returns The hexagonal coordinate corresponding to the canvas coordinates.
 */
export function canvasToHexCoordinate(x: number, y: number, metrics: HexGridMetrics): HexCoordinate {
    const scaledX = (x - metrics.cellWidth / 2) / metrics.innerSize;
    const scaledY = (y - metrics.cellHeight / 2) / metrics.innerSize;

    const q = (2 / 3) * scaledX;
    const r = (-1 / 3) * scaledX + (Math.sqrt(3) / 3) * scaledY;

    return HexCoordinate.ofRounded(q, r);
}

/**
 * Draws a segment of a hexagon on the canvas.
 * @param ctx The canvas rendering context to draw on.
 * @param x The center x-coordinate of the hexagon.
 * @param y The center y-coordinate of the hexagon.
 * @param segment The segment of the hexagon to draw.
 * @param metrics The rendering state containing cell dimensions.
 */
export function drawHexagonSegment(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    segment: HexDirection,
    metrics: HexGridMetrics,
) {
    ctx.beginPath();

    switch (segment) {
        case 0: // Top segment
            ctx.moveTo(x - metrics.cellWidth / 4, y - metrics.cellHeight / 2);
            ctx.lineTo(x + metrics.cellWidth / 4, y - metrics.cellHeight / 2);
            break;
        case 1: // Top-right segment
            ctx.moveTo(x + metrics.cellWidth / 4, y - metrics.cellHeight / 2);
            ctx.lineTo(x + metrics.cellWidth / 2, y);
            break;
        case 2: // Bottom-right segment
            ctx.moveTo(x + metrics.cellWidth / 2, y);
            ctx.lineTo(x + metrics.cellWidth / 4, y + metrics.cellHeight / 2);
            break;
        case 3: // Bottom segment
            ctx.moveTo(x + metrics.cellWidth / 4, y + metrics.cellHeight / 2);
            ctx.lineTo(x - metrics.cellWidth / 4, y + metrics.cellHeight / 2);
            break;
        case 4: // Bottom-left segment
            ctx.moveTo(x - metrics.cellWidth / 4, y + metrics.cellHeight / 2);
            ctx.lineTo(x - metrics.cellWidth / 2, y);
            break;
        case 5: // Top-left segment
            ctx.moveTo(x - metrics.cellWidth / 2, y);
            ctx.lineTo(x - metrics.cellWidth / 4, y - metrics.cellHeight / 2);
            break;
    }

    ctx.stroke();
}

/**
 * Draws debug information for a hexagon cell on the canvas.
 * This includes the q and r coordinates of the hexagon.
 *
 * @param ctx The canvas rendering context to draw on.
 * @param coordinate The hexagonal coordinate of the cell.
 * @param metrics The rendering state containing cell dimensions.
 */
export function drawHexagonDebugInfo(
    ctx: CanvasRenderingContext2D,
    coordinate: HexCoordinate,
    metrics: HexGridMetrics,
) {
    const { x, y } = hexCoordinateToCanvas(coordinate, metrics);

    const sCoordinate = -coordinate.q - coordinate.r;

    let qText = coordinate.q.toFixed(0);
    let rText = coordinate.r.toFixed(0);
    let sText = sCoordinate.toFixed(0);

    if (coordinate.q === 0 && coordinate.r === 0) {
        qText = 'Q';
        rText = 'R';
        sText = 'S';
    }

    // Draw q coordinate below top right segment
    ctx.fillStyle = 'red';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(qText, x + metrics.cellWidth * (3 / 8) - 4, y - metrics.cellHeight / 4 + 8);

    // Draw r coordinate above bottom segment
    ctx.fillStyle = 'blue';
    ctx.textAlign = 'center';
    ctx.fillText(rText, x, y + metrics.cellHeight / 2 - 4);

    // Draw virtual s coordinate below top left segment
    ctx.fillStyle = '#00FF0080';
    ctx.textAlign = 'left';
    ctx.fillText(sText, x - metrics.cellWidth * (3 / 8) + 4, y - metrics.cellHeight / 4 + 8);
}

export function drawHexagonContents(ctx: CanvasRenderingContext2D, x: number, y: number, contents: string) {
    ctx.fillStyle = 'black';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(contents, x, y);
}
