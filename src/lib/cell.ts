import type { HexCoordinate } from './coordinates';

export interface CellState {
    readonly coordinate: HexCoordinate;
    readonly group: number;
    value: number | null;

    isSelected: boolean;
    isEditable: boolean;
    isValid: boolean;
}

export function isCellSameGroup(a: CellState, b: CellState): boolean {
    return a.group === b.group;
}
