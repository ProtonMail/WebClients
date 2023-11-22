export const waitUntil = (cb: () => boolean, refresh: number, timeout: number = 5_000): Promise<void> =>
    new Promise((resolve, reject) => {
        if (cb()) return resolve();

        let interval: NodeJS.Timeout;

        const timer = setTimeout(() => {
            clearInterval(interval);
            reject();
        }, timeout);

        interval = setInterval(() => {
            if (!cb()) return;
            clearTimeout(timer);
            resolve();
        }, refresh);
    });
