import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import type { GameBoardState, GameMetadata } from '../../lib/board';
import type { GameStateUpdater } from '../../lib/state-reducer';
import { canvasToHexCoordinate, type HexGridMetrics } from '../../lib/render/hexagons';
import { planRender } from '../../lib/render/render-planner';
import { HexCoordinate } from '../../lib/coordinates';
import { drawBoard } from '../../lib/render/board-drawer';

const DefaultSize = 32;
const BoardPadding = 8;

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
}

export const GameBoardUI: FC<GameBoardUIProps> = ({
    meta,
    state,
    gameUpdater,
    cellSize = DefaultSize,
    showDebugInfo,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastMoveCoord = useRef<HexCoordinate | null>(null);
    const selectionMode = useRef<SelectionMode>(SelectionMode.None);

    const [gridMetrics, setGridMetrics] = useState<HexGridMetrics>(() => ({
        innerSize: cellSize,
        cellWidth: cellSize * 2,
        cellHeight: Math.sqrt(3) * cellSize,
        horizontalSpacing: cellSize * 1.5,
        verticalSpacing: Math.sqrt(3) * cellSize,
        horizontalOffset: 0,
    }));

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

    const handleInputStart = useCallback(
        (x: number, y: number, multiSelect: boolean) => {
            const coordinate = canvasToHexCoordinate(x, y, gridMetrics);
            lastMoveCoord.current = coordinate;

            const cell = state.cells.get(coordinate);
            if (!cell) {
                gameUpdater.deselectAllCells();
                return;
            }

            if (multiSelect) {
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
        [state, gridMetrics],
    );

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

            handleInputStart(x, y, event.shiftKey);
        },
        [handleInputStart],
    );

    const handleInputMove = useCallback(
        (x: number, y: number) => {
            const mode = selectionMode.current;
            if (mode === SelectionMode.None) {
                return;
            }

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
        },
        [gridMetrics, gameUpdater],
    );

    const handleMouseMove = useCallback(
        (event: React.MouseEvent<HTMLCanvasElement>) => {
            const canvas = canvasRef.current;
            if (!canvas) {
                return;
            }

            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left - BoardPadding;
            const y = event.clientY - rect.top - BoardPadding;

            handleInputMove(x, y);
        },
        [handleInputMove],
    );

    const handleInputEnd = useCallback(() => {
        lastMoveCoord.current = null;
        selectionMode.current = SelectionMode.None;
    }, []);

    const handleMouseUp = useCallback(() => {
        handleInputEnd();
    }, [handleInputEnd]);

    // Register touch events for mobile devices
    // Can't use React's onTouch events because we need to prevent default behavior
    // to avoid scrolling and other interactions
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const handleTouchStart = (event: TouchEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) {
                return;
            }

            const touch = event.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left - BoardPadding;
            const y = touch.clientY - rect.top - BoardPadding;

            // TODO: Check if this behaviour feels right
            handleInputStart(x, y, event.touches.length > 1);

            event.preventDefault();
        };

        const handleTouchMove = (event: TouchEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) {
                return;
            }

            const touch = event.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left - BoardPadding;
            const y = touch.clientY - rect.top - BoardPadding;

            handleInputMove(x, y);

            event.preventDefault();
        };

        const handleTouchEnd = (event: TouchEvent) => {
            handleInputEnd();
            event.preventDefault();
        };

        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

        return () => {
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchmove', handleTouchMove);
            canvas.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleInputStart, handleInputMove, handleInputEnd]);

    useEffect(() => {
        const updateCanvasSize = () => {
            const container = containerRef.current;
            const canvas = canvasRef.current;
            if (!container || !canvas) {
                return;
            }

            const ratio = Math.ceil(window.devicePixelRatio);
            const { clientWidth, clientHeight } = container;
            canvas.width = clientWidth * ratio;
            canvas.height = clientHeight * ratio;

            const minSize = Math.min(clientWidth, clientHeight);
            const gridSize = 8;
            const cellSize = (2 * minSize - 4 * BoardPadding) / (3 * gridSize + 4);

            setGridMetrics({
                innerSize: cellSize,
                cellWidth: cellSize * 2,
                cellHeight: Math.sqrt(3) * cellSize,
                horizontalSpacing: cellSize * 1.5,
                verticalSpacing: Math.sqrt(3) * cellSize,
                horizontalOffset: (clientWidth - minSize) / 2,
            });
        };

        // Update canvas size on mount and whenever the container resizes
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
        };
    }, []);

    return (
        <div ref={containerRef} className="flex justify-center min-h-0 min-w-0 aspect-square relative">
            <canvas
                ref={canvasRef}
                className="w-full h-full absolute"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            />
        </div>
    );
};
