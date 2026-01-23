import type { MaybePromise } from '@proton/pass/types';

type WaitUntilCallback = (() => MaybePromise<boolean>) | { check: () => MaybePromise<boolean>; cancel: () => boolean };

export const waitUntil = (cb: WaitUntilCallback, refresh: number, timeout: number = 5_000): Promise<void> => {
    const check = typeof cb === 'function' ? cb : cb.check;
    const cancel = typeof cb === 'function' ? undefined : cb.cancel;

    let timer: NodeJS.Timeout;
    let interval: NodeJS.Timeout;
    let fulfilled = false;

    const clear = () => {
        clearTimeout(timer);
        clearInterval(interval);
    };

    return new Promise<void>(async (res, rej) => {
        const resolve = () => {
            if (fulfilled) return;
            fulfilled = true;
            clear();
            res();
        };

        const reject = (err?: unknown) => {
            if (fulfilled) return;
            fulfilled = true;
            clear();
            rej(err);
        };

        const run = async () => {
            try {
                if (cancel?.()) return reject();
                else if (await check()) return resolve();
            } catch (err) {
                reject(err);
            }
        };

        await run();

        if (!fulfilled) {
            timer = setTimeout(reject, timeout);
            interval = setInterval(run, refresh);
        }
    });
};
