export const createPromiseCache = <Returned>() => {
    let promise: Promise<Returned> | undefined = undefined;

    const set = (newPromise: Promise<Returned>) => {
        promise = newPromise;
        newPromise
            .finally(() => {
                promise = undefined;
            })
            .catch(() => {});
    };

    return (select: () => Promise<Returned> | undefined, cb: () => Promise<Returned>): Promise<Returned> => {
        if (promise) {
            return promise;
        }
        const value = select();
        if (value) {
            return value;
        }
        const newPromise = cb();
        set(newPromise);
        return newPromise;
    };
};

export const createPromiseMapCache = <Returned>() => {
    const promises: { [key: string]: Promise<Returned> | undefined } = {};
    const set = (id: string, newPromise: Promise<Returned>) => {
        promises[id] = newPromise;
        newPromise
            .finally(() => {
                delete promises[id];
            })
            .catch(() => {});
    };
    return (id: string, select: () => Promise<Returned> | undefined, cb: () => Promise<Returned>) => {
        const oldPromise = promises[id];
        if (oldPromise) {
            return oldPromise;
        }
        const value = select();
        if (value) {
            return value;
        }
        const newPromise = cb();
        set(id, newPromise);
        return newPromise;
    };
};
