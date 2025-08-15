import { CellType, type CellState } from '../cell';
import { AllHexDirections, HexCoordinate } from '../coordinates';
import type { GenerateResult } from './common';

export function generateFlowerGridBoard(): GenerateResult {
    const cells = new Map<HexCoordinate, CellState>();

    generateFlowerGridCells(cells, HexCoordinate.of(4, 2));
    generateFlowerGridCells(cells, HexCoordinate.of(3, 0));
    generateFlowerGridCells(cells, HexCoordinate.of(6, -1));
    generateFlowerGridCells(cells, HexCoordinate.of(7, 1));
    generateFlowerGridCells(cells, HexCoordinate.of(5, 4));
    generateFlowerGridCells(cells, HexCoordinate.of(2, 5));
    generateFlowerGridCells(cells, HexCoordinate.of(1, 3));

    return {
        cells,
    };
}

function generateFlowerGridCells(cells: Map<HexCoordinate, CellState>, center: HexCoordinate): void {
    // Generate the center cell
    cells.set(center, {
        coordinate: center,
        type: CellType.Editable,
        value: null,
    });

    for (const direction of AllHexDirections) {
        const neighborCoord = center.next(direction);
        cells.set(neighborCoord, {
            coordinate: neighborCoord,
            type: CellType.Editable,
            value: null,
        });
    }
}
