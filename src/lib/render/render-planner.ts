import type { GameBoardState, GameMetadata } from '../board';
import { isCellSameGroup } from '../cell';
import { AllHexDirections, HexCoordinate, HexDirection } from '../coordinates';
import {
    EmptySegmentRenderPattern,
    type BackgroundType,
    type CellRenderState,
    type CellSegmentStyle,
    type ContentType,
} from './cell';

export interface RenderPlan {
    cellsToRender: CellRenderState[];
    widthInCells: number;
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

    let minQ = Infinity;
    let maxQ = -Infinity;

    for (const cell of state.cells.values()) {
        minQ = Math.min(cell.coordinate.q, minQ);
        maxQ = Math.max(cell.coordinate.q, maxQ);

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
                type: shouldDisplayThickBorder ? 'thick' : 'normal',
            };
        }

        let contents: string | null = null;
        let contentType: ContentType | null = null;
        if (cell.value !== null) {
            contents = cell.value.toFixed(0);

            if (!cell.isValid) {
                contentType = 'wrong';
            } else if (cell.isEditable) {
                contentType = 'guess';
            } else {
                contentType = 'clue';
            }
        }

        let backgroundType: BackgroundType = 'none';
        if (cell.isSelected) {
            backgroundType = 'selected';
        }

        let centerMarkings: string | null = null;
        if (cell.centerNotes.size > 0 && cell.value === null) {
            centerMarkings = Array.from(cell.centerNotes.values())
                .sort()
                .map((value) => value.toFixed(0))
                .join('');
        }

        let outerMarkings: string[] = [];
        if (cell.outerNotes.size > 0 && cell.value === null) {
            outerMarkings = Array.from(cell.outerNotes.values())
                .sort()
                .map((value) => value.toFixed(0));
        }

        cellsToRender.push({
            coordinate: cell.coordinate,
            segments,
            contents,
            contentType,
            backgroundType,
            centerMarkings,
            outerMarkings,
        });
    }

    return {
        cellsToRender,
        widthInCells: maxQ - minQ,
    };
}
