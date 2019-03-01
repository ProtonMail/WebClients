export const handleUnauthorized = (e) => {
    if (e.status === 401) {
        return true;
    }
};

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

export const createRefreshHandler = (refresh, logout) => {
    let refreshPromise;

    const clear = () => {
        refreshPromise = undefined;
    };

    return () => {
        if (refreshPromise) {
            return refreshPromise;
        }

        refreshPromise = refresh()
            .then(clear)
            .catch((e) => {
                clear();
                logout();
                throw e;
            });
        return refreshPromise;
    };
};
