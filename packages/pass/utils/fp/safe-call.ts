import type { Maybe } from '@proton/pass/types';

export const safeCall =
    <T extends (...args: any[]) => any>(fn?: T) =>
    (...args: Parameters<T>): Maybe<ReturnType<T>> => {
        try {
            return fn?.(...args);
        } catch {}
    };

export const safeAsyncCall =
    <T extends (...args: any[]) => Promise<any>>(fn?: T) =>
    async (...args: Parameters<T>): Promise<Maybe<Awaited<ReturnType<T>>>> => {
        try {
            const res = await fn?.(...args);
            return res;
        } catch {}
    };
