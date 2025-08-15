import { useReducer, type ActionDispatch } from 'react';
import { CellType, type CellState } from './cell';
import type { HexCoordinate } from './coordinates';

/**
 * GameMetadata interface represents the metadata of a game board.
 * This is for information which does not change during the game.
 */
export interface GameMetadata {
    readonly width: number;
    readonly height: number;
}

/**
 * GameBoardState interface represents the state of the game board.
 * This includes all the cells in the game board and their current state.
 */
export interface GameBoardState {
    /**
     * All the cells in the game board as a map.
     * The keys are HexCoordinate objects representing the coordinates of the cells.
     * The values are CellState objects representing the state of each cell.
     *
     * * @see HexCoordinate for the coordinate system used.
     * * @see GameMetadata for the metadata of the game board.
     */
    readonly cells: Map<HexCoordinate, CellState>;
}

function initialiseGameState(metadata: GameMetadata): GameBoardState {
    const { width, height } = metadata;

    // Initialize the game board with blank cells
    const cells = new Map<HexCoordinate, CellState>();
    for (let q = 0; q < width; q++) {
        const rOffset = Math.floor(q / 2);
        for (let r = -rOffset; r < height - rOffset; r++) {
            const cell: CellState = {
                coordinate: { q, r },
                type: CellType.Blank,
            };

            cells.set(cell.coordinate, cell);
        }
    }

    // Explicitly return a value matching the GameBoardState type
    return {
        cells,
    } as GameBoardState;
}

type GameUpdateAction = never;

export function useGameState(metadata: GameMetadata): [GameBoardState, ActionDispatch<GameUpdateAction>] {
    return useReducer<GameBoardState, GameMetadata, GameUpdateAction>(
        (state, action) => {
            // Handle game state updates here
            return state;
        },
        metadata,
        initialiseGameState,
    );
}
