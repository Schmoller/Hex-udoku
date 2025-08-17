import type { HexCoordinate } from './coordinates';

export interface CellState {
    readonly coordinate: HexCoordinate;
    readonly group: number;
    value: number | null;

    centerNotes: Set<number>;
    outerNotes: Set<number>;

    isSelected: boolean;
    isEditable: boolean;
    isValid: boolean;
}

export function newCellState(coordinate: HexCoordinate, group = 0): CellState {
    return {
        coordinate,
        group,
        value: null,
        centerNotes: new Set<number>(),
        outerNotes: new Set<number>(),
        isSelected: false,
        isEditable: false,
        isValid: true,
    };
}

export function cloneCellState(state: CellState): CellState {
    return {
        ...state,
        centerNotes: new Set(state.centerNotes),
        outerNotes: new Set(state.outerNotes),
    };
}

export function isCellSameGroup(a: CellState, b: CellState): boolean {
    return a.group === b.group;
}
