import type { CellState } from '../cell';
import type { HexCoordinate } from '../coordinates';

export interface GenerateResult {
    cells: Map<HexCoordinate, CellState>;
}
