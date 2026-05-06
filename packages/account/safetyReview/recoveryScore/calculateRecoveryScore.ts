import clamp from '@proton/utils/clamp';

import type { RecoveryItem } from '../recoveryState/recoveryState';

const MIN_SCORE = 0;
const MAX_SCORE = 10;

export const calculateRecoveryScore = (recoveryItems: RecoveryItem[]): { score: number; maxScore: number } => {
    const availableOptions = recoveryItems.filter((item) => item.isAvailable);
    const enabledAndActiveOptions = availableOptions.filter(
        (item) => item.isEnabled && item.countsTowardScore !== false
    );
    const score = clamp(enabledAndActiveOptions.length, MIN_SCORE, MAX_SCORE);
    return { score, maxScore: MAX_SCORE };
};

export type RecoveryScore = ReturnType<typeof calculateRecoveryScore>;
