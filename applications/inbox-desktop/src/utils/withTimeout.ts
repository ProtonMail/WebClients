import { mainLogger } from "./log";

/**
 * Race a promise against a timeout. If the promise resolves or rejects within
 * `timeoutMs`, the result is propagated as-is. If the timeout fires first, a
 * warning is logged with `label` and the returned promise resolves to
 * `undefined` so the caller can continue.
 *
 * Use this around startup `await`s that must NEVER block app launch
 * indefinitely on third-party I/O (e.g. Sentry's Crashpad init on Windows).
 * The wrapped work continues to run in the background after the timeout fires;
 * we attach a permanent rejection handler so a late rejection from the
 * abandoned promise can never become an unhandled-promise-rejection in the
 * main process (which Node 22 logs at warn level and ultimately crashes on).
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T | undefined> {
    let timedOut = false;

    // Guard the wrapped promise so that any rejection that arrives AFTER the
    // timeout has already fired is logged and swallowed instead of leaking out
    // as an unhandled rejection. Rejections that arrive BEFORE the timeout are
    // still propagated to the race normally.
    const guarded = promise.catch((err) => {
        if (timedOut) {
            mainLogger.warn(
                `[startup-timeout] ${label} eventually rejected after timeout fired; swallowed to prevent unhandled rejection:`,
                err,
            );
            return undefined as unknown as T;
        }
        throw err;
    });

    let timer: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<undefined>((resolve) => {
        timer = setTimeout(() => {
            timedOut = true;
            mainLogger.warn(`[startup-timeout] ${label} did not complete within ${timeoutMs}ms; continuing startup.`);
            resolve(undefined);
        }, timeoutMs);
        timer.unref();
    });

    try {
        return await Promise.race([guarded, timeoutPromise]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}
