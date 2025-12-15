import { DEFAULT_TIMEOUT } from '../constants';
import window from '../window';
import { createOfflineError, createTimeoutError } from './ApiError';
import { createUrl } from './helpers';
import type { FetchConfig } from './interface';
import { serializeData } from './serialize';
import { checkStatus } from './status';

interface FetchHelperConfig extends Omit<FetchConfig, 'data' | 'input'> {}

const fetchHelper = ({
    url: urlString,
    params,
    signal,
    timeout = DEFAULT_TIMEOUT,
    ...rest
}: FetchHelperConfig): Promise<Response> => {
    const abortController = new AbortController();
    let isTimeout = false;

    const config: RequestInit = {
        mode: 'cors',
        credentials: 'include',
        redirect: 'follow',
        signal: abortController.signal,
        ...rest,
    } as const;

    const url = createUrl(urlString, params, window.location.origin);

    const timeoutHandle = setTimeout(() => {
        isTimeout = true;
        abortController.abort();
    }, timeout);

    const otherAbortCallback = () => {
        abortController.abort();
        clearTimeout(timeoutHandle);
    };

    signal?.addEventListener('abort', otherAbortCallback);

    const errorConfig = {
        url: urlString,
        params,
        ...rest,
    };

    return fetch(url, config)
        .catch((e) => {
            if (isTimeout) {
                throw createTimeoutError(errorConfig);
            }

            if (e?.name === 'AbortError') {
                throw e;
            }

            // Assume any other error is offline error.
            throw createOfflineError(errorConfig);
        })
        .then((response) => {
            return checkStatus(response, errorConfig);
        })
        .finally(() => {
            clearTimeout(timeoutHandle);
            signal?.removeEventListener('abort', otherAbortCallback);
        });
};

export function protonFetch({ data, headers, input = 'json', ...config }: FetchConfig): Promise<Response> {
    const { headers: dataHeaders, body } = serializeData(data, input);

    return fetchHelper({
        ...config,
        headers: {
            ...headers,
            ...dataHeaders,
        },
        body,
    });
}
