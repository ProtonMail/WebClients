import { MINUTE } from '@proton/shared/lib/constants';

export const AUTOMATIC_REJOIN_RUN_LIMIT = 3;

export const AUTOMATIC_REJOIN_RUN_WINDOW_MS = 2 * MINUTE;

const getRunStartsInWindow = (runStartTimesMs: readonly number[], nowMs: number) =>
    runStartTimesMs.filter((startTimeMs) => nowMs - startTimeMs < AUTOMATIC_REJOIN_RUN_WINDOW_MS);

export const canStartAutomaticRejoinRun = (runStartTimesMs: readonly number[], nowMs: number) =>
    getRunStartsInWindow(runStartTimesMs, nowMs).length < AUTOMATIC_REJOIN_RUN_LIMIT;

export const recordAutomaticRejoinRunStart = (runStartTimesMs: readonly number[], nowMs: number): readonly number[] => [
    ...getRunStartsInWindow(runStartTimesMs, nowMs),
    nowMs,
];
