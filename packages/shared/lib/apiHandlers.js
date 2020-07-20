export const getError = (e) => {
    const { data, status } = e;

    if (!data) {
        return {
            status,
        };
    }

    const { Error: errorMessage, Code: errorCode } = data;

    if (!errorMessage) {
        return {
            status,
        };
    }

    return {
        status,
        code: errorCode,
        message: errorMessage,
    };
};

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
