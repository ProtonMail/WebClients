import type { Maybe } from '@proton/pass/types';

export const safeCall =
    <T extends (...args: any[]) => any>(fn?: T) =>
    (...args: Parameters<T>): Maybe<ReturnType<T>> => {
        try {
            return fn?.(...args);
        } catch {}
    };

export const safeAsyncCall =
    <T extends (...args: any[]) => Promise<any>, R = undefined>(fn?: T, fallback?: R) =>
    async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | R> => {
        try {
            if (!fn) return fallback as R;
            const res = await fn?.(...args);
            return res;
        } catch {
            return fallback as R;
        }
    };
