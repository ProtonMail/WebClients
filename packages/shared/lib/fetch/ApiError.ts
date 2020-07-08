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

export const createOfflineError = (config: any) => {
    const error = new ApiError('No network connection', 0, 'OfflineError');
    error.config = config;
    return error;
};

export const createTimeoutError = (config: any) => {
    const error = new ApiError('Request timed out', -1, 'TimeoutError');
    error.config = config;
    return error;
};
