import type { GameBoardState } from '../board';
import { AllHexDirections, type HexCoordinate } from '../coordinates';

export function clearNotesInAppropriateCells(state: GameBoardState, value: number, from: HexCoordinate): void {
    // Clear the ranks
    for (const direction of AllHexDirections) {
        let nextCoord = from.next(direction);
        while (state.cells.has(nextCoord)) {
            const cell = state.cells.get(nextCoord);
            nextCoord = nextCoord.next(direction);

            if (!cell || !cell.isEditable) {
                continue;
            }

            cell.outerNotes.delete(value);
            cell.centerNotes.delete(value);
        }
    }

    // Clear the groups
    const originalCell = state.cells.get(from)!;

    for (const cell of state.cells.values()) {
        if (!cell.isEditable || cell.group != originalCell.group) {
            continue;
        }

        cell.outerNotes.delete(value);
        cell.centerNotes.delete(value);
    }
}
