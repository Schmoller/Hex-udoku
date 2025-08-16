import type { Random } from 'random';
import type { GameBoardState } from '../board';

export function pruneBoard(board: GameBoardState, targetNumberOfFilledCells: number, random: Random): void {
    const cells = Array.from(board.cells.values());
    const filledCells = cells.filter((cell) => cell.value !== null);

    const cellsToPrune = filledCells.length - targetNumberOfFilledCells;
    const shuffledCells = random.shuffle(filledCells);

    for (let i = 0; i < cellsToPrune; i++) {
        const cellToPrune = shuffledCells[i];
        cellToPrune.value = null;
        cellToPrune.isEditable = true;
    }
}
