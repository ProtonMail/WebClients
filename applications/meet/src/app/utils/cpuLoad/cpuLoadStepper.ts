export type CpuLoadLevel = 'critical' | 'serious' | 'relieved';

export interface CpuLoadStepperState {
    dropCount: number;
    streak: { level: Exclude<CpuLoadLevel, 'serious'>; elapsedMs: number } | null;
    countedUntil: number;
    pausedAt: number | null;
}

export const FIRST_DROP_AFTER_MS = 30_000;
export const DROP_AFTER_MS = 20_000;
export const REVERT_AFTER_MS = 15_000;

export const createCpuLoadStepperState = (now: number, dropCount = 0): CpuLoadStepperState => ({
    dropCount,
    streak: null,
    countedUntil: now,
    pausedAt: null,
});

export const pauseCpuLoad = (state: CpuLoadStepperState, now: number): CpuLoadStepperState => ({
    ...state,
    countedUntil: state.countedUntil + now - (state.pausedAt ?? now),
    pausedAt: now,
});

export const stepCpuLoad = (
    state: CpuLoadStepperState,
    { level, now, maxDrops }: { level: CpuLoadLevel; now: number; maxDrops: number }
): CpuLoadStepperState => {
    if (level === 'serious') {
        return { ...state, streak: null, countedUntil: now, pausedAt: null };
    }

    const elapsedMs = state.streak?.level === level ? state.streak.elapsedMs + now - state.countedUntil : 0;
    const isCritical = level === 'critical';
    const shouldChange = isCritical
        ? state.dropCount < maxDrops && elapsedMs >= (state.dropCount === 0 ? FIRST_DROP_AFTER_MS : DROP_AFTER_MS)
        : state.dropCount > 0 && elapsedMs >= REVERT_AFTER_MS;

    return {
        dropCount: shouldChange ? state.dropCount + (isCritical ? 1 : -1) : state.dropCount,
        streak: { level, elapsedMs: shouldChange ? 0 : elapsedMs },
        countedUntil: now,
        pausedAt: null,
    };
};
