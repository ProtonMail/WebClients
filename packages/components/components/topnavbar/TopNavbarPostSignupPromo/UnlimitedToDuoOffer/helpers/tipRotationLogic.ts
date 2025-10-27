import { differenceInDays, fromUnixTime, getUnixTime } from 'date-fns';

import type { UnlimitedToDuoRotationState } from './interface';
import { MAX_DAYS_TO_SHOW_SAME_TIP } from './interface';

/**
 * Calculates whether the tip rotation should be updated based on the current rotation state and elapsed time.
 *
 * @param currentRotationDate - Unix timestamp of the last rotation (0 if never rotated)
 * @param currentTipIndex - Current tip index (0-indexed)
 * @param tipsLength - Total number of tips available
 *
 * @returns A RotationResult with the new tipIndex and rotationDate if an update is needed, or null if no change should occur
 *
 * On first run (currentRotationDate is 0):
 * - Returns a random tip index (0-indexed) with the current timestamp
 *
 * On subsequent runs:
 * - Checks if enough days have passed since the last rotation (>= maxDays)
 * - If yes, returns the next tip index (cycling back to 0 when reaching the end) with the current timestamp
 * - If no, returns null (no rotation needed)
 */
export const calculateRotationUpdate = (
    currentRotationDate: number,
    currentTipIndex: number,
    tipsLength: number
): UnlimitedToDuoRotationState | null => {
    const currentDate = new Date();

    if (currentRotationDate === 0) {
        return {
            tipIndex: Math.floor(Math.random() * tipsLength),
            rotationDate: getUnixTime(currentDate),
        };
    }

    const lastRotationDate = fromUnixTime(currentRotationDate);
    const daysSinceLastRotation = differenceInDays(currentDate, lastRotationDate);

    if (daysSinceLastRotation >= MAX_DAYS_TO_SHOW_SAME_TIP) {
        return {
            tipIndex: (currentTipIndex + 1) % tipsLength,
            rotationDate: getUnixTime(currentDate),
        };
    }

    return null;
};
