export const waitUntil = (cb: () => boolean, timeout: number): Promise<void> => {
    return new Promise<void>((resolve) => {
        if (cb()) {
            return resolve();
        }

        setTimeout(async () => {
            await waitUntil(cb, timeout);
            resolve();
        }, timeout);
    });
};
