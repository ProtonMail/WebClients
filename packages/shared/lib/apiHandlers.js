export const createOnceHandler = (createPromise) => {
    let promise;

    const clear = () => {
        promise = undefined;
    };

    return (...args) => {
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
