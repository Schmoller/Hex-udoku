export const enum Difficulty {
    Easy = 'easy',
    Moderate = 'moderate',
    Hard = 'hard',
    Extreme = 'extreme',
}

export const AllDifficulties: Difficulty[] = [
    Difficulty.Easy,
    Difficulty.Moderate,
    Difficulty.Hard,
    Difficulty.Extreme,
];

/**
 * What a puzzle has to look like to count as a given difficulty.
 *
 * Clue count on its own is a weak signal, because the same number of clues can produce anything
 * from a pure scanning exercise to an unsolvable grid. So each tier pairs a clue count with a
 * range of "hard steps" - the number of times the solver has to reach past singles - and a puzzle
 * is only accepted if it lands inside that range.
 *
 * @see profilePuzzle for how the hard steps are counted.
 */
export interface DifficultySpec {
    /** How many digits to try to leave on the board. */
    readonly clues: number;

    /** The fewest steps beyond singles the puzzle must need, so a tier is never too easy. */
    readonly minHardSteps: number;

    /** The most steps beyond singles the puzzle may need, so a tier is never too hard. */
    readonly maxHardSteps: number;
}

/**
 * The tiers, tuned by grading samples of pruned boards at each clue count.
 *
 * The clue counts come from where the techniques required actually change: every 16 clue board
 * falls to singles alone, whereas below about 8 clues the great majority of boards cannot be
 * finished without guessing. 6 clues is the floor for this grid - no board has ever pruned
 * below it - but boards that small are not fair puzzles, so Extreme stops short of it.
 */
export const DifficultySpecs: Record<Difficulty, DifficultySpec> = {
    [Difficulty.Easy]: { clues: 16, minHardSteps: 0, maxHardSteps: 0 },
    [Difficulty.Moderate]: { clues: 12, minHardSteps: 1, maxHardSteps: 3 },
    [Difficulty.Hard]: { clues: 10, minHardSteps: 2, maxHardSteps: 8 },
    [Difficulty.Extreme]: { clues: 8, minHardSteps: 3, maxHardSteps: Number.POSITIVE_INFINITY },
};
