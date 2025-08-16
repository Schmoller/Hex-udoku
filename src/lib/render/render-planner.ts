import type { GameBoardState, GameMetadata } from '../board';
import { isCellSameGroup } from '../cell';
import { AllHexDirections, HexCoordinate, HexDirection } from '../coordinates';
import { EmptySegmentRenderPattern, type CellRenderState, type CellSegmentStyle } from './cell';

const NormalSegmentWidth = 1;
const ThickSegmentWidth = 4;

export interface RenderPlan {
    cellsToRender: CellRenderState[];
}

/**
 * Generates a render plan based on the game metadata and current state of the game board.
 * The render plan specifies which cells need to be rendered and their properties.
 *
 * @param meta The metadata of the game board.
 * @param state The current state of the game board.
 * @returns A render plan that specifies what needs to be rendered.
 */
export function planRender(meta: GameMetadata, state: GameBoardState): RenderPlan {
    const cellsToRender: CellRenderState[] = [];
    const visitedCells = new Set<HexCoordinate>();

    for (const cell of state.cells.values()) {
        visitedCells.add(cell.coordinate);

        const segments: Record<HexDirection, CellSegmentStyle | null> = {
            ...EmptySegmentRenderPattern,
        };

        // Iterate through all hex directions to determine which segments to render
        for (const direction of AllHexDirections) {
            const neighborCoord = cell.coordinate.next(direction);
            if (visitedCells.has(neighborCoord)) {
                // If the neighbor has already been processed, skip rendering this segment
                continue;
            }

            const neighborCell = state.cells.get(neighborCoord);

            let shouldDisplayThickBorder = false;

            if (!neighborCell || !isCellSameGroup(cell, neighborCell)) {
                shouldDisplayThickBorder = true;
            }

            segments[direction] = {
                render: true,
                width: shouldDisplayThickBorder ? ThickSegmentWidth : NormalSegmentWidth,
                color: 'black',
            };
        }

        let contents: string | null = null;
        if (cell.value !== null) {
            contents = cell.value.toFixed(0);
        }

        let backgroundColor: string | null = null;
        if (cell.isSelected) {
            backgroundColor = 'oklch(88.2% 0.059 254.128)';
        }

        cellsToRender.push({
            coordinate: cell.coordinate,
            segments,
            contents,
            backgroundColor,
        });
    }

    return {
        cellsToRender,
    };
}
