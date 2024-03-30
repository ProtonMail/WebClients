type WaitUntilCallback = (() => boolean) | { check: () => boolean; cancel: () => boolean };

export const waitUntil = (cb: WaitUntilCallback, refresh: number, timeout: number = 5_000): Promise<void> => {
    const check = typeof cb === 'function' ? cb : cb.check;
    const cancel = typeof cb === 'function' ? undefined : cb.cancel;

    let timer: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    const clear = () => {
        clearTimeout(timer);
        clearInterval(interval);
    };

    return new Promise<void>((resolve, reject) => {
        if (cancel?.()) return reject();
        if (check()) return resolve();

        timer = setTimeout(() => reject(clear()), timeout);
        interval = setInterval(() => {
            if (cancel?.()) return reject(clear());
            if (!check()) return;
            resolve(clear());
        }, refresh);
    });
};
