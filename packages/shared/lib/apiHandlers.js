export const STATUS_CODE_UNAUTHORIZED = 401;
export const STATUS_CODE_UNLOCK = 403;

export const getError = (e) => {
    if (!e.data) {
        return;
    }

    const { Error: errorMessage, Code: errorCode } = e.data;

    if (!errorMessage) {
        return;
    }

    return {
        code: errorCode,
        message: errorMessage
    };
};

export const createOnceHandler = (createPromise, onError) => {
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
                if (onError) {
                    onError();
                }
                throw e;
            });
        return promise;
    };
};
