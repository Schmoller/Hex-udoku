import { useEffect, useMemo, useRef, type FC } from 'react';
import type { GameBoardState, GameMetadata } from './lib/board';
import {
    drawHexagonDebugInfo,
    drawHexagonSegment,
    hexCoordinateToCanvas,
    type HexGridMetrics,
} from './lib/render/hexagons';
import { planRender } from './lib/render/render-planner';
import { AllHexDirections } from './lib/coordinates';

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

    showDebugInfo?: boolean;
}

export const GameBoardUI: FC<GameBoardUIProps> = ({ meta, state, cellSize = DefaultSize, showDebugInfo }) => {
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

    const renderPlan = useMemo(() => {
        return planRender(meta, state);
    }, [meta, state]);

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

        renderPlan.cellsToRender.forEach((cell) => {
            const { x, y } = hexCoordinateToCanvas(cell.coordinate, gridMetrics);

            if (showDebugInfo) {
                drawHexagonDebugInfo(ctx, cell.coordinate, gridMetrics);
            }

            for (const direction of AllHexDirections) {
                const segment = cell.segments[direction];
                if (!segment || !segment.render) {
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = 'gray';
                    drawHexagonSegment(ctx, x, y, direction, gridMetrics);
                    continue;
                }

                ctx.lineWidth = segment.width;
                ctx.strokeStyle = segment.color;
                drawHexagonSegment(ctx, x, y, direction, gridMetrics);
            }
        });
    };

    // Draw the board whenever the state changes
    useEffect(() => {
        drawBoard();
    }, [renderPlan, gridMetrics, showDebugInfo]);

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
