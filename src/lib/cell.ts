import type { HexCoordinate } from './coordinates';

export interface CellState {
    readonly coordinate: HexCoordinate;
    readonly group: number;
    value: number | null;

    isSelected: boolean;
    isEditable: boolean;
    isValid: boolean;
}

export function newCellState(coordinate: HexCoordinate, group = 0): CellState {
    return {
        coordinate,
        group,
        value: null,
        isSelected: false,
        isEditable: false,
        isValid: true,
    };
}

export function isCellSameGroup(a: CellState, b: CellState): boolean {
    return a.group === b.group;
}
