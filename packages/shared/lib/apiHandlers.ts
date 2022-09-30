export const createOnceHandler = <T extends any>(createPromise: (...args: T[]) => Promise<void>) => {
    let promise: Promise<void> | undefined;

    const clear = () => {
        promise = undefined;
    };

    return (...args: T[]) => {
        if (promise) {
            return promise;
        }

        promise = createPromise(...args)
            .then(clear)
            .catch((e) => {
                clear();
                throw e;
            });
        return promise;
    };
};
