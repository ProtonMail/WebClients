import { describe, expect, it } from 'vitest';

import type { CpuLoadLevel, CpuLoadStepperState } from './cpuLoadStepper';
import {
    DROP_AFTER_MS,
    FIRST_DROP_AFTER_MS,
    REVERT_AFTER_MS,
    createCpuLoadStepperState,
    pauseCpuLoad,
    stepCpuLoad,
} from './cpuLoadStepper';

const MAX_DROPS = 3;
const TICK_MS = 1000;

const tick = (state: CpuLoadStepperState, level: CpuLoadLevel, now: number) =>
    stepCpuLoad(state, { level, now, maxDrops: MAX_DROPS });

const run = (state: CpuLoadStepperState, level: CpuLoadLevel, from: number, durationMs: number) => {
    let current = state;
    for (let now = from; now <= from + durationMs; now += TICK_MS) {
        current = tick(current, level, now);
    }
    return current;
};

describe('stepCpuLoad', () => {
    it('should not drop before the critical load lasted long enough', () => {
        const state = run(createCpuLoadStepperState(0), 'critical', 0, FIRST_DROP_AFTER_MS - TICK_MS);

        expect(state.dropCount).toBe(0);
    });

    it('should drop once the critical load is sustained', () => {
        const state = run(createCpuLoadStepperState(0), 'critical', 0, FIRST_DROP_AFTER_MS);

        expect(state.dropCount).toBe(1);
    });

    it('should wait the delay between drops before each further drop', () => {
        let state = run(createCpuLoadStepperState(0), 'critical', 0, FIRST_DROP_AFTER_MS);
        state = run(state, 'critical', FIRST_DROP_AFTER_MS + TICK_MS, DROP_AFTER_MS - 2 * TICK_MS);
        expect(state.dropCount).toBe(1);

        state = tick(state, 'critical', FIRST_DROP_AFTER_MS + DROP_AFTER_MS);
        expect(state.dropCount).toBe(2);
    });

    it('should wait the first drop delay again once every drop was reverted', () => {
        let state = run(createCpuLoadStepperState(0, 1), 'relieved', 0, REVERT_AFTER_MS);
        expect(state.dropCount).toBe(0);

        state = run(state, 'critical', REVERT_AFTER_MS + TICK_MS, FIRST_DROP_AFTER_MS - TICK_MS);
        expect(state.dropCount).toBe(0);

        state = tick(state, 'critical', REVERT_AFTER_MS + TICK_MS + FIRST_DROP_AFTER_MS);
        expect(state.dropCount).toBe(1);
    });

    it('should stop at the maximum number of drops', () => {
        const state = run(createCpuLoadStepperState(0), 'critical', 0, 10 * DROP_AFTER_MS);

        expect(state.dropCount).toBe(MAX_DROPS);
    });

    it('should never change by more than one drop per step', () => {
        const state = tick(createCpuLoadStepperState(0), 'critical', 10 * DROP_AFTER_MS);

        expect(state.dropCount).toBe(0);
        expect(tick(state, 'critical', 100 * DROP_AFTER_MS).dropCount).toBe(1);
    });

    it('should not revert during a short dip in the load', () => {
        let state = run(createCpuLoadStepperState(0), 'critical', 0, FIRST_DROP_AFTER_MS);
        state = run(state, 'relieved', FIRST_DROP_AFTER_MS + TICK_MS, REVERT_AFTER_MS - 2 * TICK_MS);
        state = tick(state, 'critical', FIRST_DROP_AFTER_MS + REVERT_AFTER_MS);

        expect(state.dropCount).toBe(1);
    });

    it('should revert the drops one at a time once the load is relieved', () => {
        const allDroppedAt = FIRST_DROP_AFTER_MS + 2 * DROP_AFTER_MS;
        let state = run(createCpuLoadStepperState(0), 'critical', 0, allDroppedAt);
        expect(state.dropCount).toBe(3);

        const relievedFrom = allDroppedAt + TICK_MS;
        state = run(state, 'relieved', relievedFrom, REVERT_AFTER_MS);
        expect(state.dropCount).toBe(2);

        state = run(state, 'relieved', relievedFrom + REVERT_AFTER_MS + TICK_MS, REVERT_AFTER_MS - TICK_MS);
        expect(state.dropCount).toBe(1);

        state = run(state, 'relieved', relievedFrom + 2 * REVERT_AFTER_MS + TICK_MS, 2 * REVERT_AFTER_MS);
        expect(state.dropCount).toBe(0);
    });

    it('should restart the wait when the critical load is interrupted', () => {
        let state = run(createCpuLoadStepperState(0), 'critical', 0, FIRST_DROP_AFTER_MS - 2 * TICK_MS);
        state = tick(state, 'relieved', FIRST_DROP_AFTER_MS - TICK_MS);
        state = run(state, 'critical', FIRST_DROP_AFTER_MS, FIRST_DROP_AFTER_MS - TICK_MS);
        expect(state.dropCount).toBe(0);

        state = tick(state, 'critical', 2 * FIRST_DROP_AFTER_MS);
        expect(state.dropCount).toBe(1);
    });

    it('should settle when one drop brings the load from critical to serious', () => {
        let state = createCpuLoadStepperState(0);
        let changes = 0;
        for (let now = TICK_MS; now <= 120_000; now += TICK_MS) {
            const next = tick(state, state.dropCount === 0 ? 'critical' : 'serious', now);
            changes += next.dropCount === state.dropCount ? 0 : 1;
            state = next;
        }

        expect(changes).toBe(1);
        expect(state.dropCount).toBe(1);
    });

    it.each([0, 1, MAX_DROPS])('should hold %i drops under a sustained serious load', (dropCount) => {
        const state = run(createCpuLoadStepperState(0, dropCount), 'serious', 0, 10 * REVERT_AFTER_MS);

        expect(state.dropCount).toBe(dropCount);
    });

    it('should restart the drop wait when a serious load interrupts the critical load', () => {
        let state = run(createCpuLoadStepperState(0), 'critical', 0, FIRST_DROP_AFTER_MS - 2 * TICK_MS);
        state = tick(state, 'serious', FIRST_DROP_AFTER_MS - TICK_MS);
        state = run(state, 'critical', FIRST_DROP_AFTER_MS, FIRST_DROP_AFTER_MS - TICK_MS);
        expect(state.dropCount).toBe(0);

        state = tick(state, 'critical', 2 * FIRST_DROP_AFTER_MS);
        expect(state.dropCount).toBe(1);
    });

    it('should wait the full revert delay of relief after a serious load', () => {
        let state = run(createCpuLoadStepperState(0, 1), 'relieved', 0, REVERT_AFTER_MS - 2 * TICK_MS);
        state = tick(state, 'serious', REVERT_AFTER_MS - TICK_MS);
        state = run(state, 'relieved', REVERT_AFTER_MS, REVERT_AFTER_MS - TICK_MS);
        expect(state.dropCount).toBe(1);

        state = tick(state, 'relieved', 2 * REVERT_AFTER_MS);
        expect(state.dropCount).toBe(0);
    });

    it('should not revert below zero', () => {
        const state = run(createCpuLoadStepperState(0), 'relieved', 0, 3 * REVERT_AFTER_MS);

        expect(state.dropCount).toBe(0);
    });
});

const SHORT_RECONNECT_TICKS = 2;
const LONG_RECONNECT_TICKS = 120;

const reconnect = (state: CpuLoadStepperState, from: number, ticks: number) => {
    let current = state;
    for (let index = 0; index < ticks; index++) {
        current = pauseCpuLoad(current, from + index * TICK_MS);
    }
    return current;
};

const fullStreakTicks = (level: CpuLoadLevel, dropCount: number) => {
    if (level !== 'critical') {
        return REVERT_AFTER_MS / TICK_MS + 1;
    }
    return (dropCount === 0 ? FIRST_DROP_AFTER_MS : DROP_AFTER_MS) / TICK_MS + 1;
};

const ticksUntilNextChange = (state: CpuLoadStepperState, level: CpuLoadLevel, from: number) => {
    let current = state;
    for (let ticks = 1; ticks <= 60; ticks++) {
        const next = tick(current, level, from + ticks * TICK_MS);
        if (next.dropCount !== current.dropCount) {
            return ticks;
        }
        current = next;
    }
    return null;
};

type StartingState =
    | 'no drop pending'
    | 'critical streak in progress'
    | 'drop just applied'
    | 'relief streak in progress'
    | 'at max drops';

const startingStates: Record<
    StartingState,
    { state: CpuLoadStepperState; endsAt: number; pendingLevel: CpuLoadLevel }
> = {
    'no drop pending': {
        state: tick(createCpuLoadStepperState(0), 'serious', 0),
        endsAt: 0,
        pendingLevel: 'critical',
    },
    'critical streak in progress': {
        state: run(createCpuLoadStepperState(0), 'critical', 0, 6 * TICK_MS),
        endsAt: 6 * TICK_MS,
        pendingLevel: 'critical',
    },
    'drop just applied': {
        state: run(createCpuLoadStepperState(0), 'critical', 0, FIRST_DROP_AFTER_MS),
        endsAt: FIRST_DROP_AFTER_MS,
        pendingLevel: 'critical',
    },
    'relief streak in progress': {
        state: run(createCpuLoadStepperState(0, 1), 'relieved', 0, 6 * TICK_MS),
        endsAt: 6 * TICK_MS,
        pendingLevel: 'relieved',
    },
    'at max drops': {
        state: run(createCpuLoadStepperState(0, MAX_DROPS), 'critical', 0, 6 * TICK_MS),
        endsAt: 6 * TICK_MS,
        pendingLevel: 'critical',
    },
};

type StepperEvent =
    | 'critical tick'
    | 'serious tick'
    | 'relieved tick'
    | 'short reconnect'
    | 'long reconnect'
    | 'resume after long reconnect';

const applyEvent = (
    event: StepperEvent,
    { state, endsAt, pendingLevel }: (typeof startingStates)[StartingState]
): { state: CpuLoadStepperState; endsAt: number } => {
    const from = endsAt + TICK_MS;
    switch (event) {
        case 'critical tick':
            return { state: tick(state, 'critical', from), endsAt: from };
        case 'serious tick':
            return { state: tick(state, 'serious', from), endsAt: from };
        case 'relieved tick':
            return { state: tick(state, 'relieved', from), endsAt: from };
        case 'short reconnect':
            return {
                state: reconnect(state, from, SHORT_RECONNECT_TICKS),
                endsAt: from + (SHORT_RECONNECT_TICKS - 1) * TICK_MS,
            };
        case 'long reconnect':
            return {
                state: reconnect(state, from, LONG_RECONNECT_TICKS),
                endsAt: from + (LONG_RECONNECT_TICKS - 1) * TICK_MS,
            };
        case 'resume after long reconnect': {
            const resumedAt = from + LONG_RECONNECT_TICKS * TICK_MS;
            return {
                state: tick(reconnect(state, from, LONG_RECONNECT_TICKS), pendingLevel, resumedAt),
                endsAt: resumedAt,
            };
        }
    }
};

describe('stepCpuLoad transitions', () => {
    it.each<[StartingState, StepperEvent, number, 'kept' | 'lost' | '-', number | null]>([
        ['no drop pending', 'critical tick', 0, '-', 30],
        ['no drop pending', 'serious tick', 0, '-', 31],
        ['no drop pending', 'relieved tick', 0, '-', 31],
        ['no drop pending', 'short reconnect', 0, '-', 31],
        ['no drop pending', 'long reconnect', 0, '-', 31],
        ['no drop pending', 'resume after long reconnect', 0, '-', 30],

        ['critical streak in progress', 'critical tick', 0, 'kept', 23],
        ['critical streak in progress', 'serious tick', 0, 'lost', 31],
        ['critical streak in progress', 'relieved tick', 0, 'lost', 31],
        ['critical streak in progress', 'short reconnect', 0, 'kept', 23],
        ['critical streak in progress', 'long reconnect', 0, 'kept', 23],
        ['critical streak in progress', 'resume after long reconnect', 0, 'kept', 22],

        ['drop just applied', 'critical tick', 1, 'kept', 19],
        ['drop just applied', 'serious tick', 1, 'lost', 21],
        ['drop just applied', 'relieved tick', 1, 'lost', 21],
        ['drop just applied', 'short reconnect', 1, 'kept', 19],
        ['drop just applied', 'long reconnect', 1, 'kept', 19],
        ['drop just applied', 'resume after long reconnect', 1, 'kept', 18],

        ['relief streak in progress', 'critical tick', 1, 'lost', 16],
        ['relief streak in progress', 'serious tick', 1, 'lost', 16],
        ['relief streak in progress', 'relieved tick', 1, 'kept', 8],
        ['relief streak in progress', 'short reconnect', 1, 'kept', 8],
        ['relief streak in progress', 'long reconnect', 1, 'kept', 8],
        ['relief streak in progress', 'resume after long reconnect', 1, 'kept', 7],

        ['at max drops', 'critical tick', MAX_DROPS, '-', null],
        ['at max drops', 'serious tick', MAX_DROPS, '-', null],
        ['at max drops', 'relieved tick', MAX_DROPS, '-', null],
        ['at max drops', 'short reconnect', MAX_DROPS, '-', null],
        ['at max drops', 'long reconnect', MAX_DROPS, '-', null],
        ['at max drops', 'resume after long reconnect', MAX_DROPS, '-', null],
    ])(
        '%s + %s: %i drops, streak progress %s, next change after %s ticks of the pending level',
        (startingStateName, event, expectedDropCount, progress, expectedTicks) => {
            const startingState = startingStates[startingStateName];
            const { state, endsAt } = applyEvent(event, startingState);
            const ticks = ticksUntilNextChange(state, startingState.pendingLevel, endsAt);

            expect(state.dropCount).toBe(expectedDropCount);
            expect(ticks).toBe(expectedTicks);
            if (progress !== '-') {
                expect(ticks! < fullStreakTicks(startingState.pendingLevel, state.dropCount)).toBe(progress === 'kept');
            }
        }
    );

    it('should not drop on the first critical tick after a long reconnect', () => {
        let state = run(createCpuLoadStepperState(0), 'critical', TICK_MS, 2 * TICK_MS);
        state = reconnect(state, 4 * TICK_MS, LONG_RECONNECT_TICKS);
        state = tick(state, 'critical', (4 + LONG_RECONNECT_TICKS) * TICK_MS);

        expect(state.dropCount).toBe(0);
    });

    it('should not revert on the first relieved tick after a long reconnect', () => {
        let state = run(createCpuLoadStepperState(0, 1), 'relieved', TICK_MS, 2 * TICK_MS);
        state = reconnect(state, 4 * TICK_MS, LONG_RECONNECT_TICKS);
        state = tick(state, 'relieved', (4 + LONG_RECONNECT_TICKS) * TICK_MS);

        expect(state.dropCount).toBe(1);
    });
});
