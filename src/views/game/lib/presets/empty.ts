import type { GameMetadata } from '../board';
import { CellType, type CellState } from '../cell';
import { HexCoordinate } from '../coordinates';
import type { GenerateResult } from './common';

export function generateEmptyGridBoard({ width, height }: GameMetadata): GenerateResult {
    const cells = new Map<HexCoordinate, CellState>();
    for (let q = 0; q < width; q++) {
        const rOffset = Math.floor(q / 2);
        for (let r = -rOffset; r < height - rOffset; r++) {
            const cell: CellState = {
                coordinate: HexCoordinate.of(q, r),
                type: CellType.Blank,
            };

            cells.set(cell.coordinate, cell);
        }
    }

    return {
        cells,
    };
}
