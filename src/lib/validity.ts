import { AllUnitTypes, getUnit, type GameBoardState } from './board';
import type { CellState } from './cell';
import { HexCoordinate } from './coordinates';
import { CellValidity } from './rules/common';
import { isCellUniqueInUnit } from './rules/unique';

/**
 * Checks each cell in the board for validity, and generates a new state
 * with the validity set
 * @returns A duplicate state which contains the cells with updated validity
 */
export function updateBoardValidity(board: GameBoardState): GameBoardState {
    const checkedCells = new Map<HexCoordinate, CellState>();

    // Tracks whether the whole board is not only valid, but fully filled out
    let isComplete = true;

    for (const cell of board.cells.values()) {
        const validity = checkCellValidity(cell, board);

        if (validity !== CellValidity.Valid) {
            isComplete = false;
        }

        checkedCells.set(cell.coordinate, {
            ...cell,
            isValid: validity !== CellValidity.Invalid,
        });
    }

    return {
        ...board,
        cells: checkedCells,
        isComplete,
    };
}

/**
 * Verifies the cell validity against all rules
 * @param cell The cell to check
 * @param board The game board which contains the cell
 * @returns Whether the cell is valid
 */
export function checkCellValidity(cell: CellState, board: GameBoardState): CellValidity {
    if (cell.value === null) {
        return CellValidity.Blank;
    }

    for (const unitType of AllUnitTypes) {
        const unit = getUnit(board, cell.coordinate, unitType);

        const validity = isCellUniqueInUnit(cell, unit);

        if (validity === CellValidity.Invalid) {
            return CellValidity.Invalid;
        }
    }

    return CellValidity.Valid;
}
