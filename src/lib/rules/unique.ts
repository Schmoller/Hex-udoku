import type { CellState } from '../cell';
import { CellValidity } from './common';

/**
 * Checks if a cell's value is unique within the given unit.
 *
 * @param cell The cell to check.
 * @param unit The set of cells that form the unit (e.g., rank, or group).
 */
export function isCellUniqueInUnit(cell: CellState, unit: CellState[]): CellValidity {
    // Assume that cell is contained within the unit
    if (!unit.includes(cell)) {
        throw new Error('Assertion: cell must be contained within the unit');
    }

    if (cell.value == null) {
        return CellValidity.Blank;
    }

    const seenDigits = new Set<number>();

    for (const otherCell of unit) {
        if (otherCell === cell) {
            continue;
        }

        if (otherCell.value !== null) {
            seenDigits.add(otherCell.value);
        }
    }

    if (seenDigits.has(cell.value)) {
        return CellValidity.Invalid;
    }

    return CellValidity.Valid;
}
