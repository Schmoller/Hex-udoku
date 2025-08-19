import type { GameBoardState } from './board';
import type { CellState } from './cell';
import { HexCoordinate } from './coordinates';

export function serialiseGameState(state: GameBoardState): string {
    const serialisedCells = Array.from(state.cells.values()).map((cell) => ({
        coordinate: { q: cell.coordinate.q, r: cell.coordinate.r },
        value: cell.value,
        isSelected: cell.isSelected,
        isEditable: cell.isEditable,
        centerNotes: Array.from(cell.centerNotes),
        outerNotes: Array.from(cell.outerNotes),
        group: cell.group,
        isValid: cell.isValid,
    }));

    return JSON.stringify({
        cells: serialisedCells,
        isComplete: state.isComplete,
        highlightValue: state.highlightValue,
    });
}

export function deserialiseGameState(serialised: string): GameBoardState {
    const data = JSON.parse(serialised);
    const cells = new Map<HexCoordinate, CellState>();

    // TODO: Validate the structure of `data` before proceeding

    for (const cellData of data.cells) {
        const coordinate = HexCoordinate.of(cellData.coordinate.q, cellData.coordinate.r);

        cells.set(coordinate, {
            coordinate,
            value: cellData.value,
            isSelected: cellData.isSelected,
            isEditable: cellData.isEditable,
            centerNotes: new Set(cellData.centerNotes),
            outerNotes: new Set(cellData.outerNotes),
            group: cellData.group,
            isValid: cellData.isValid,
        });
    }

    return {
        cells,
        isComplete: data.isComplete,
        highlightValue: data.highlightValue,
    };
}
