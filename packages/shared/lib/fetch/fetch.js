import { DEFAULT_TIMEOUT } from '../constants';
import { createOfflineError, createTimeoutError } from './ApiError';
import { checkStatus, createUrl, serializeData } from './helpers';

const fetchHelper = ({ url: urlString, params, signal, timeout = DEFAULT_TIMEOUT, ...rest }) => {
    const abortController = new AbortController();
    let isTimeout = false;

    const config = {
        mode: 'cors',
        credentials: 'include',
        redirect: 'follow',
        signal: abortController.signal,
        ...rest,
    };

    const url = createUrl(urlString, params);

    const timeoutHandle = setTimeout(() => {
        isTimeout = true;
        abortController.abort();
    }, timeout);

    const otherAbortCallback = () => {
        abortController.abort();
        clearTimeout(timeoutHandle);
    };

    signal?.addEventListener('abort', otherAbortCallback);

    return fetch(url, config)
        .catch((e) => {
            if (isTimeout) {
                throw createTimeoutError(config);
            }

            if (e?.name === 'AbortError') {
                throw e;
            }

            // Assume any other error is offline error.
            throw createOfflineError(config);
        })
        .then((response) => {
            clearTimeout(timeoutHandle);
            return checkStatus(response, config);
        })
        .finally(() => {
            signal?.removeEventListener('abort', otherAbortCallback);
        });
};

export default ({ data, headers, input = 'json', ...config }) => {
    const { headers: dataHeaders, body } = serializeData(data, input);

    return fetchHelper({
        ...config,
        headers: {
            ...headers,
            ...dataHeaders,
        },
        body,
    });
};
