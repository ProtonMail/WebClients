import { createUrl, checkStatus, serializeData, createApiError } from './helpers';

const DEFAULT_TIMEOUT = 30000;

const fetchHelper = ({ url: urlString, params, signal, timeout = DEFAULT_TIMEOUT, ...rest }) => {
    const abortController = new AbortController();
    let isTimeout = false;

    const config = {
        mode: 'cors',
        credentials: 'include',
        redirect: 'follow',
        signal: abortController.signal,
        ...rest
    };

    const url = createUrl(urlString, params);

    const timeoutHandle = setTimeout(() => {
        isTimeout = true;
        abortController.abort();
    }, timeout);

    if (signal) {
        signal.addEventListener('abort', () => {
            abortController.abort();
            clearTimeout(timeoutHandle);
        });
    }

    return fetch(url, config)
        .catch((e) => {
            if (isTimeout) {
                throw createApiError({
                    name: 'TimeoutError',
                    response: { status: -1, statusText: 'Request timed out' },
                    config
                });
            }

            if (e.name === 'AbortError') {
                throw e;
            }

            // Assume any other error is offline error.
            throw createApiError({
                name: 'OfflineError',
                response: { status: 0, statusText: 'No network connection' },
                config
            });
        })
        .then((response) => {
            clearTimeout(timeoutHandle);
            return checkStatus(response, config);
        });
};

export default ({ data, headers, input = 'json', ...config }) => {
    const { headers: dataHeaders, body } = serializeData(data, input);

    return fetchHelper({
        ...config,
        headers: {
            ...headers,
            ...dataHeaders
        },
        body
    });
};
