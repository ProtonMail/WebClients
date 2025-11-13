import type { Callback } from '@proton/pass/types';

export const DOM_SETTLE_MS = 1_000 / 24;

export const nextTick = (fn: Callback) => {
    setTimeout(fn, 0);
};

export const onNextTick =
    <T extends any[], R extends any>(fn: (...args: T) => R) =>
    (...args: T) =>
        nextTick(() => fn(...args));
