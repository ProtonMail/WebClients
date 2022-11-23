export class ApiError extends Error {
    response?: Response;

    status: number;

    data?: any;

    config: any;

    constructor(message: string, status: number, name: string) {
        super(message);
        Object.setPrototypeOf(this, ApiError.prototype);
        this.status = status;
        this.name = name;
    }
}

export const createApiError = (name: string, response: Response, config: any, data?: any) => {
    const { statusText, status } = response;

    const error = new ApiError(statusText, status, name);

    error.response = response;
    error.data = data;
    error.config = config;

    return error;
};

export const serializeApiErrorData = (error: ApiError) => {
    /**
     *      We are only interested in the data here, so we strip almost everything else. In particular:
     *      * error.response is typically not serializable
     *      * error.config might not be serializable either (for instance it can include (aborted) abort controllers)
     */

    return {
        name: error.name,
        status: error.status,
        statusText: error.response?.statusText || error.message,
        data: error.data,
    };
};

export const deserializeApiErrorData = ({
    name,
    status,
    statusText,
    data,
}: ReturnType<typeof serializeApiErrorData>) => {
    const error = new ApiError(statusText, status, name);

    error.data = data;

    return error;
};

export enum CUSTOM_FETCH_ERROR_STATUS_CODE {
    NO_NETWORK_CONNECTION = 0,
    TIMEOUT = -1,
}

export const createOfflineError = (config: any) => {
    const error = new ApiError(
        'No network connection',
        CUSTOM_FETCH_ERROR_STATUS_CODE.NO_NETWORK_CONNECTION,
        'OfflineError'
    );
    error.config = config;
    return error;
};

export const createTimeoutError = (config: any) => {
    const error = new ApiError('Request timed out', CUSTOM_FETCH_ERROR_STATUS_CODE.TIMEOUT, 'TimeoutError');
    error.config = config;
    return error;
};
