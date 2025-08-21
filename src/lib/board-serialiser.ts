import type { GameBoardState } from './board';
import type { CellState } from './cell';
import { HexCoordinate } from './coordinates';
import { object, number, array, boolean } from 'yup';

const CurrentVersion = 1;

interface SerialisedCell {
    coordinate: { q: number; r: number };
    value: number | null;
    isSelected: boolean;
    isEditable: boolean;
    centerNotes: number[];
    outerNotes: number[];
    group: number;
    isValid: boolean;
}

interface SerialisedGameState {
    _version: number;
    cells: SerialisedCell[];
    isComplete: boolean;
    highlightValue: number | null;
}

const CellSchema = object({
    coordinate: object({
        q: number().required(),
        r: number().required(),
    }),
    value: number().nullable().defined(),
    isSelected: boolean().required(),
    isEditable: boolean().required(),
    centerNotes: array(number().required()).required(),
    outerNotes: array(number().required()).required(),
    group: number().required(),
    isValid: boolean().required(),
});

const GameStateSchema = object({
    _version: number().required(),
    cells: array(CellSchema).required(),
    isComplete: boolean().required(),
    highlightValue: number().nullable().defined(),
});

export function serialiseGameState(state: GameBoardState): string {
    const serialisedCells: SerialisedCell[] = Array.from(state.cells.values()).map((cell) => ({
        coordinate: { q: cell.coordinate.q, r: cell.coordinate.r },
        value: cell.value,
        isSelected: cell.isSelected,
        isEditable: cell.isEditable,
        centerNotes: Array.from(cell.centerNotes),
        outerNotes: Array.from(cell.outerNotes),
        group: cell.group,
        isValid: cell.isValid,
    }));

    const serialisedState: SerialisedGameState = {
        _version: CurrentVersion,
        cells: serialisedCells,
        isComplete: state.isComplete,
        highlightValue: state.highlightValue,
    };

    return JSON.stringify(serialisedState);
}

export function deserialiseGameState(serialised: string): GameBoardState {
    const data = JSON.parse(serialised);
    const cells = new Map<HexCoordinate, CellState>();

    if (data._version !== CurrentVersion) {
        throw new Error(`Unsupported game state version: ${data._version}`);
    }

    const validatedData = GameStateSchema.validateSync(data, { stripUnknown: true });

    for (const cellData of validatedData.cells) {
        const coordinate = HexCoordinate.of(cellData.coordinate.q, cellData.coordinate.r);

        cells.set(coordinate, {
            coordinate,
            value: cellData.value,
            isSelected: cellData.isSelected,
            isEditable: cellData.isEditable,
            centerNotes: new Set(cellData.centerNotes),
            outerNotes: new Set(cellData.outerNotes),
            group: cellData.group,
            isValid: cellData.isValid,
        });
    }

    return {
        cells,
        isComplete: validatedData.isComplete,
        highlightValue: validatedData.highlightValue,
    };
}
