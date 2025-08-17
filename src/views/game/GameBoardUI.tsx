import { useCallback, useEffect, useMemo, useRef, type FC } from 'react';
import type { GameBoardState, GameMetadata } from '../../lib/board';
import type { GameStateUpdater } from '../../lib/state-reducer';
import { canvasToHexCoordinate, type HexGridMetrics } from '../../lib/render/hexagons';
import { planRender } from '../../lib/render/render-planner';
import { HexCoordinate } from '../../lib/coordinates';
import { drawBoard } from '../../lib/render/board-drawer';

const DefaultSize = 32;
const BoardPadding = 16;

const enum SelectionMode {
    None,
    Select,
    Clear,
}

export interface GameBoardUIProps {
    meta: GameMetadata;
    state: GameBoardState;
    gameUpdater: GameStateUpdater;

    /**
     * Size of a cell in pixels.
     * This is the size in a flat-top orientation.
     */
    cellSize?: number;

    showDebugInfo?: boolean;

    onDigitSelect: (digit: number) => void;
}

export const GameBoardUI: FC<GameBoardUIProps> = ({
    meta,
    state,
    gameUpdater,
    cellSize = DefaultSize,
    showDebugInfo,
    onDigitSelect,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastMoveCoord = useRef<HexCoordinate | null>(null);
    const selectionMode = useRef<SelectionMode>(SelectionMode.None);

    const gridMetrics = useMemo<HexGridMetrics>(
        () => ({
            innerSize: cellSize,
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

    // Draw the board whenever the state changes
    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }

        drawBoard(canvasRef.current, renderPlan, gridMetrics, { showDebugInfo, padding: BoardPadding });
    }, [renderPlan, gridMetrics, showDebugInfo]);

    const handleMouseDown = useCallback(
        (event: React.MouseEvent<HTMLCanvasElement>) => {
            const canvas = canvasRef.current;
            if (!canvas) {
                return;
            }

            if ((event.buttons & 0x1) !== 1) {
                return;
            }

            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left - BoardPadding;
            const y = event.clientY - rect.top - BoardPadding;

            const coordinate = canvasToHexCoordinate(x, y, gridMetrics);
            lastMoveCoord.current = coordinate;

            const cell = state.cells.get(coordinate);
            if (!cell) {
                gameUpdater.deselectAllCells();
                return;
            }

            const isMultiSelect = event.shiftKey;

            if (isMultiSelect) {
                if (cell.isSelected) {
                    selectionMode.current = SelectionMode.Clear;
                    gameUpdater.setCellSelection(coordinate, false);
                } else {
                    selectionMode.current = SelectionMode.Select;
                    gameUpdater.setCellSelection(coordinate, true);
                }
            } else {
                gameUpdater.restartSelection(coordinate);
                selectionMode.current = SelectionMode.Select;
            }
        },
        [state],
    );

    const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const mode = selectionMode.current;
        if (mode === SelectionMode.None) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left - BoardPadding;
        const y = event.clientY - rect.top - BoardPadding;

        const coordinate = canvasToHexCoordinate(x, y, gridMetrics);
        // If we are at the same coordinate, don't process
        if (coordinate === lastMoveCoord.current) {
            return;
        }

        let select: boolean;
        if (mode === SelectionMode.Select) {
            select = true;
        } else {
            select = false;
        }

        gameUpdater.setCellSelection(coordinate, select);

        lastMoveCoord.current = coordinate;
    }, []);

    const handleMouseUp = useCallback(() => {
        lastMoveCoord.current = null;
        selectionMode.current = SelectionMode.None;
    }, []);

    const handleKeyPress = useCallback(
        (event: React.KeyboardEvent<HTMLCanvasElement>) => {
            event.preventDefault();
            switch (event.key) {
                case 'Escape':
                    gameUpdater.deselectAllCells();
                    break;
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                    onDigitSelect(parseInt(event.key, 10));
                    break;
                case 'Delete':
                case 'Backspace':
                    gameUpdater.clearSelectedCells();
                    break;
            }
        },
        [onDigitSelect],
    );

    return (
        <div className="border-4">
            <canvas
                ref={canvasRef}
                tabIndex={0}
                width={gridMetrics.horizontalSpacing * (meta.width - 1) + gridMetrics.cellWidth + BoardPadding * 2}
                height={gridMetrics.verticalSpacing * meta.height + gridMetrics.cellHeight / 2 + BoardPadding * 2}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onKeyDown={handleKeyPress}
            />
        </div>
    );
};
