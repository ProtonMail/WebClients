import { createApiError } from './ApiError';

export const checkStatus = (response: Response, config: any): Response | Promise<never> => {
    const { status } = response;

    if (status >= 200 && status < 300) {
        return response;
    }

    return response
        .json()
        .catch(() => {
            return {};
        })
        .then((data) => {
            throw createApiError('StatusCodeError', response, config, data);
        });
};
