import { useEffect, useMemo, useRef, type FC } from 'react';
import type { GameBoardState, GameMetadata } from './lib/board';
import type { HexCoordinate } from './lib/coordinates';

const DefaultSize = 32;
const BoardPadding = 16;

interface RenderingState {
    cellWidth: number;
    cellHeight: number;
    horizontalSpacing: number;
    verticalSpacing: number;
}

export interface GameBoardUIProps {
    meta: GameMetadata;
    state: GameBoardState;
    /**
     * Size of a cell in pixels.
     * This is the size in a flat-top orientation.
     */
    cellSize?: number;
}

export const GameBoardUI: FC<GameBoardUIProps> = ({ meta, state, cellSize = DefaultSize }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const renderState = useMemo<RenderingState>(
        () => ({
            cellWidth: cellSize * 2,
            cellHeight: Math.sqrt(3) * cellSize,
            horizontalSpacing: cellSize * 1.5,
            verticalSpacing: Math.sqrt(3) * cellSize,
        }),
        [cellSize],
    );

    const drawBoard = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        ctx.resetTransform();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(BoardPadding, BoardPadding);

        state.cells.forEach((cell) => {
            const { q, r } = cell.coordinate;
            const { x, y } = hexCoordinateToCanvas({ q, r }, renderState);

            drawHexagonDebugInfo(ctx, cell.coordinate, x, y, renderState);

            drawHexagonSegment(ctx, x, y, 0, renderState);
            drawHexagonSegment(ctx, x, y, 1, renderState);
            drawHexagonSegment(ctx, x, y, 2, renderState);
            drawHexagonSegment(ctx, x, y, 3, renderState);
            drawHexagonSegment(ctx, x, y, 4, renderState);
            drawHexagonSegment(ctx, x, y, 5, renderState);
        });
    };

    // Draw the board whenever the state changes
    useEffect(() => {
        drawBoard();
    }, [state, renderState]);

    return (
        <div className="border-4">
            <canvas
                ref={canvasRef}
                width={renderState.horizontalSpacing * (meta.width - 1) + renderState.cellWidth + BoardPadding * 2}
                height={renderState.verticalSpacing * meta.height + renderState.cellHeight / 2 + BoardPadding * 2}
            />
        </div>
    );
};

function hexCoordinateToCanvas(coordinate: HexCoordinate, renderState: RenderingState) {
    // Flat top orientation
    const x = coordinate.q * renderState.horizontalSpacing + renderState.cellWidth / 2;
    const y = (coordinate.r + coordinate.q / 2) * renderState.verticalSpacing + renderState.cellHeight / 2;

    return { x, y };
}

/**
 * HexSegment type represents a segment of a hexagon.
 * It can take values from 0 to 5, representing the six segments of a hexagon.
 * 0 is the top segment, 1 is the top-right segment, and so on in clockwise order.
 */
type HexSegment = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Draws a segment of a hexagon on the canvas.
 * @param ctx The canvas rendering context to draw on.
 * @param x The center x-coordinate of the hexagon.
 * @param y The center y-coordinate of the hexagon.
 * @param segment The segment of the hexagon to draw.
 * @param renderState The rendering state containing cell dimensions.
 */
function drawHexagonSegment(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    segment: HexSegment,
    renderState: RenderingState,
) {
    ctx.beginPath();

    switch (segment) {
        case 0: // Top segment
            ctx.moveTo(x - renderState.cellWidth / 4, y - renderState.cellHeight / 2);
            ctx.lineTo(x + renderState.cellWidth / 4, y - renderState.cellHeight / 2);
            break;
        case 1: // Top-right segment
            ctx.moveTo(x + renderState.cellWidth / 4, y - renderState.cellHeight / 2);
            ctx.lineTo(x + renderState.cellWidth / 2, y);
            break;
        case 2: // Bottom-right segment
            ctx.moveTo(x + renderState.cellWidth / 2, y);
            ctx.lineTo(x + renderState.cellWidth / 4, y + renderState.cellHeight / 2);
            break;
        case 3: // Bottom segment
            ctx.moveTo(x + renderState.cellWidth / 4, y + renderState.cellHeight / 2);
            ctx.lineTo(x - renderState.cellWidth / 4, y + renderState.cellHeight / 2);
            break;
        case 4: // Bottom-left segment
            ctx.moveTo(x - renderState.cellWidth / 4, y + renderState.cellHeight / 2);
            ctx.lineTo(x - renderState.cellWidth / 2, y);
            break;
        case 5: // Top-left segment
            ctx.moveTo(x - renderState.cellWidth / 2, y);
            ctx.lineTo(x - renderState.cellWidth / 4, y - renderState.cellHeight / 2);
            break;
    }

    ctx.stroke();
}

function drawHexagonDebugInfo(
    ctx: CanvasRenderingContext2D,
    coordinate: HexCoordinate,
    x: number,
    y: number,
    renderState: RenderingState,
) {
    // Draw q coordinate below top segment
    ctx.fillStyle = 'red';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(coordinate.q.toFixed(0), x, y - renderState.cellHeight / 2 + 15);

    // Draw r coordinate to the left of the bottom-right segment
    ctx.fillStyle = 'blue';
    ctx.textAlign = 'right';
    ctx.fillText(coordinate.r.toFixed(0), x + renderState.cellWidth * (3 / 8) - 2, y + renderState.cellHeight / 4);
}
