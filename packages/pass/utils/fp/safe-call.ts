import type { Maybe } from '@proton/pass/types';

export const safeCall =
    <T extends (...args: any[]) => any>(fn?: T) =>
    (...args: Parameters<T>): Maybe<ReturnType<T>> => {
        try {
            return fn?.(...args);
        } catch (_) {}
    };
