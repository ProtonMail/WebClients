type WaitUntilCallback = (() => boolean) | { check: () => boolean; cancel: () => boolean };

export const waitUntil = (cb: WaitUntilCallback, refresh: number, timeout: number = 5_000): Promise<void> => {
    const check = typeof cb === 'function' ? cb : cb.check;
    const cancel = typeof cb === 'function' ? undefined : cb.cancel;

    return new Promise((resolve, reject) => {
        if (cancel?.()) reject();
        if (check()) return resolve();

        let interval: NodeJS.Timeout;

        const timer = setTimeout(() => {
            clearInterval(interval);
            reject();
        }, timeout);

        interval = setInterval(() => {
            if (cancel?.()) return reject();
            if (!check()) return;

            clearTimeout(timer);
            resolve();
        }, refresh);
    });
};
