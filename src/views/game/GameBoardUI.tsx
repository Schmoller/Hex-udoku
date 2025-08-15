import { useEffect, useMemo, useRef, type FC } from 'react';
import type { GameBoardState, GameMetadata } from './lib/board';
import {
    drawHexagonDebugInfo,
    drawHexagonSegment,
    hexCoordinateToCanvas,
    type HexGridMetrics,
} from './lib/render/hexagons';

const DefaultSize = 32;
const BoardPadding = 16;

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

    const gridMetrics = useMemo<HexGridMetrics>(
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
            const { x, y } = hexCoordinateToCanvas(cell.coordinate, gridMetrics);

            drawHexagonDebugInfo(ctx, cell.coordinate, gridMetrics);

            drawHexagonSegment(ctx, x, y, 0, gridMetrics);
            drawHexagonSegment(ctx, x, y, 1, gridMetrics);
            drawHexagonSegment(ctx, x, y, 2, gridMetrics);
            drawHexagonSegment(ctx, x, y, 3, gridMetrics);
            drawHexagonSegment(ctx, x, y, 4, gridMetrics);
            drawHexagonSegment(ctx, x, y, 5, gridMetrics);
        });
    };

    // Draw the board whenever the state changes
    useEffect(() => {
        drawBoard();
    }, [state, gridMetrics]);

    return (
        <div className="border-4">
            <canvas
                ref={canvasRef}
                width={gridMetrics.horizontalSpacing * (meta.width - 1) + gridMetrics.cellWidth + BoardPadding * 2}
                height={gridMetrics.verticalSpacing * meta.height + gridMetrics.cellHeight / 2 + BoardPadding * 2}
            />
        </div>
    );
};
