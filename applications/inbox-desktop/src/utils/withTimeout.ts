import { mainLogger } from "./log";

/**
 * Race a promise against a timeout. If the promise resolves or rejects within
 * `timeoutMs`, the result is propagated as-is. If the timeout fires first, a
 * warning is logged with `label` and the returned promise resolves to
 * `undefined` so the caller can continue.
 *
 * Use this around startup `await`s that must NEVER block app launch
 * indefinitely on third-party I/O (Sentry init, Squirrel handlers, etc.).
 * The original work continues to run in the background; only the awaiter
 * stops waiting.
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T | undefined> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<undefined>((resolve) => {
        timer = setTimeout(() => {
            mainLogger.warn(`[startup-timeout] ${label} did not complete within ${timeoutMs}ms; continuing startup.`);
            resolve(undefined);
        }, timeoutMs);
        timer.unref?.();
    });

    try {
        return await Promise.race([promise, timeout]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}
