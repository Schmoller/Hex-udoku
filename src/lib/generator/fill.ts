import type { Random } from 'random';
import type { GameBoardState } from '../board';
import type { CellState } from '../cell';
import { checkCellValidity } from '../validity';
import { CellValidity } from '../rules/common';

const Digits = 7;
const AllValidDigits = Array.from({ length: Digits }, (_, i) => i + 1);

export function fillBoardWithRandomNumbers(board: GameBoardState, random: Random): void {
    // We need the cells as an array so we can iterate it using an index with a known order
    const cellsAsArray = [...board.cells.values()];

    const group1 = cellsAsArray.filter((cell) => cell.group === 0);
    const group2 = cellsAsArray.filter((cell) => cell.group === 1);

    if (group1.length !== Digits) {
        throw new Error('Expected group to have exactly 7 cells');
    }

    let isRepeating = true;
    let attempts = 0;
    while (isRepeating && attempts < 4) {
        ++attempts;

        // Step zero: Clear the board
        // This is in-case the previous fill failed
        clearBoard(board);

        // Step two: Try to fill the rest of the board with valid random numbers
        // This is a backtracking algorithm that tries to fill each cell with a valid digit
        // If it fails, it backtracks and tries a different digit
        const succeeded = tryFillWithValidRandomNumbers(board, cellsAsArray, 0, random);
        if (!succeeded) {
            throw new Error('Expected random fill to have succeeded');
        }

        // Step three: Ensure that it hasn't made a repeating pattern
        // The hex grid allows for each box to have the same digits in the same order.
        // This makes a boring puzzle, so if we have this situation, retry the fill
        let isRepeating = true;
        for (let i = 0; i < Digits; i++) {
            const firstCell = group1[i];
            const secondCell = group2[i];

            if (firstCell.value !== secondCell.value) {
                isRepeating = false;
                break;
            }
        }

        if (isRepeating) {
            console.log('Found repeating pattern, retrying fill');
        }
    }
}

function clearBoard(board: GameBoardState): void {
    for (const cell of board.cells.values()) {
        cell.value = null;
        cell.isEditable = true;
    }
}

function fillGroupWithRandomNumbers(group: CellState[], random: Random): void {
    const digits = random.shuffle(AllValidDigits);

    for (let i = 0; i < group.length; i++) {
        const cell = group[i];
        cell.value = digits[i];
        cell.isEditable = false;
    }
}

function tryFillWithValidRandomNumbers(
    board: GameBoardState,
    cells: CellState[],
    startIndex: number,
    random: Random,
): boolean {
    if (startIndex >= cells.length) {
        console.log('Successfully filled the board with random numbers');
        return true;
    }

    const cell = cells[startIndex];

    // Skip non-empty cells
    if (cell.value) {
        return tryFillWithValidRandomNumbers(board, cells, startIndex + 1, random);
    }

    const digitsToCheck = random.shuffle(AllValidDigits);

    for (const digit of digitsToCheck) {
        // Test the digit in this cell
        cell.value = digit;
        cell.isEditable = false;
        const validity = checkCellValidity(cell, board);

        if (validity === CellValidity.Invalid) {
            // Try something else
            cell.value = null;
            cell.isEditable = true;
            continue;
        }

        // Number worked, move on the next
        if (tryFillWithValidRandomNumbers(board, cells, startIndex + 1, random)) {
            // Everything worked, board should be complete now
            return true;
        }

        cell.value = null;
        cell.isEditable = true;
    }

    // Nothing worked. Backtrack and try again
    return false;
}
