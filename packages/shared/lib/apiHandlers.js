export const STATUS_CODE_UNAUTHORIZED = 401;
export const STATUS_CODE_UNLOCK = 403;
export const STATUS_CODE_TOO_MANY_REQUESTS = 429;

export const getError = (e) => {
    const { data, status } = e;

    if (!data) {
        return {
            status
        };
    }

    const { Error: errorMessage, Code: errorCode } = data;

    if (!errorMessage) {
        return {
            status
        };
    }

    return {
        status,
        code: errorCode,
        message: errorMessage
    };
};

export const createOnceHandler = (createPromise) => {
    let promise;

    const clear = () => {
        promise = undefined;
    };

    return () => {
        if (promise) {
            return promise;
        }

        promise = createPromise()
            .then(clear)
            .catch((e) => {
                clear();
                throw e;
            });
        return promise;
    };
};
