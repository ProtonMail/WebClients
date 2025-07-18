import { useRef } from 'react';

import type {
    ProtonDriveHTTPClient,
    ProtonDriveHTTPClientBlobOptions,
    ProtonDriveHTTPClientJsonOptions,
} from '@protontech/drive-sdk';
import { AbortError } from '@protontech/drive-sdk';

import { useApi } from '@proton/components';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { PROTON_LOCAL_DOMAIN } from '@proton/shared/lib/localDev';

import { withTimeout } from './withTimeout';

// TODO: include SDK version with commit hash
export function useHttpClient(defaultHeaders: [string, string][] = []): ProtonDriveHTTPClient {
    const api = useApi();

    const fetchJson = async (options: ProtonDriveHTTPClientJsonOptions) => {
        try {
            const result = await api({
                url: options.url,
                method: options.method,
                headers: Object.fromEntries(options.headers.entries()),
                data: options.json,
                signal: options.signal,
                timeout: options.timeoutMs,
                ignoreHandler: [
                    // SDK has own handling of 429s.
                    HTTP_ERROR_CODES.TOO_MANY_REQUESTS,
                ],
                // Any notification should be explicit by the caller of the SDK.
                silence: true,
                // SDK has own parsing of responses.
                output: 'raw',
            });
            return result;
        } catch (error) {
            // useApi throws StatusCodeError when the status code is not 2xx.
            // SDK has own parsing of responses, thus we need to simulate
            // the normal HTTP response.
            // Ideally we could add a new output type to the api callback
            // that would also kept the non-2xx responses as well.
            if (error instanceof Error && error.name === 'StatusCodeError' && 'data' in error && 'status' in error) {
                const status = Number(error.status) || 500;
                return new Response(JSON.stringify(error.data), { status });
            }
            throw error;
        }
    };

    // Both upload and download can avoid using useApi hook, as they don't
    // need to pass credentials. The credentials to storage are passed via
    // headers for each request from the SDK.
    const fetchBlob = async (options: ProtonDriveHTTPClientBlobOptions) => {
        options.url = replaceLocalURL(options.url);
        options.headers = new Headers([...defaultHeaders, ...options.headers.entries()]);

        const { signalWithTimeout, callWithTimeout } = withTimeout(options.timeoutMs, options.signal);

        options.signal = signalWithTimeout;

        // Fetch API doesn't support providing progress events for uploading,
        // so we need to use XMLHttpRequest for that.
        if (options.method === 'POST') {
            await callWithTimeout(postXmlHttpRequest(options));
            return new Response();
        }

        const request = new Request(options.url, {
            method: options.method,
            headers: options.headers,
            body: options.body,
            signal: options.signal,
            credentials: 'omit',
        });
        return callWithTimeout(fetch(request));
    };

    // Ensure the reference is stable across renders. Never update the whole object.
    const httpClient = useRef<ProtonDriveHTTPClient>({
        fetchJson,
        fetchBlob,
    });

    httpClient.current.fetchJson = fetchJson;
    httpClient.current.fetchBlob = fetchBlob;

    return httpClient.current;
}

async function postXmlHttpRequest(options: ProtonDriveHTTPClientBlobOptions) {
    let listener: () => void;

    return new Promise<void>((resolve, reject) => {
        if (options.signal?.aborted) {
            reject(new AbortError());
            return;
        }

        const xhr = new XMLHttpRequest();

        let lastLoaded = 0;
        let total = 0;
        xhr.upload.onprogress = (e) => {
            total = e.total;
            options.onProgress?.((e.loaded - lastLoaded) / total);
            lastLoaded = e.loaded;
        };

        listener = () => {
            // When whole block is uploaded, we mustn't cancel even if we don't get a response.
            if (!total || lastLoaded !== total) {
                xhr.abort();
                reject(new AbortError());
            }
        };
        options.signal?.addEventListener('abort', listener);

        xhr.onload = async () => {
            if (xhr.status >= HTTP_STATUS_CODE.OK && xhr.status < HTTP_STATUS_CODE.BAD_REQUEST) {
                resolve();
            } else {
                reject(new Error(xhr.response?.Error || xhr.statusText || xhr.response));
            }
        };

        xhr.onerror = () => {
            reject(new Error('Request failed'));
        };
        xhr.upload.onerror = () => {
            reject(new Error('Upload request failed'));
        };

        const onTimeout = () => {
            const error = new Error('Request timed out');
            error.name = 'TimeoutError';
            reject(error);
        };
        xhr.ontimeout = onTimeout;
        xhr.upload.ontimeout = onTimeout;

        xhr.open('POST', options.url);
        xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, max-age=0');
        for (const [key, value] of options.headers.entries()) {
            xhr.setRequestHeader(key, value);
        }
        xhr.responseType = 'json';

        xhr.send(options.body);
    }).finally(() => {
        if (listener) {
            options.signal?.removeEventListener('abort', listener);
        }
    });
}

/**
 * Replaces the origin to match the current origin if running using `local-sso`.
 *
 * This is a workaround as API returns `drive-api.ENV.proton.black` URLs, while
 * the app running locally with SSO requires `drive-api.proton.dev` URLs.
 */
function replaceLocalURL(href: string) {
    if (!window.location.hostname.endsWith(PROTON_LOCAL_DOMAIN)) {
        return href;
    }

    const url = new URL(href);
    const newSubdomain = url.hostname.split('.')[0];
    const subdomain = window.location.hostname.split('.')[0];

    return href.replace(url.host, window.location.host.replace(subdomain, newSubdomain));
}

/*

Attempt to use underlying helpers instead of using the whole useApi hook.

It would be possible, but it requires connection to human verification too,
so perhaps in the end its easier to use useApi for now.

Before we get to upload and download of node contents, we can keep the SDK
running in main thread and just use it with CryptoProxy web workers, thus
the need to call API from the shared worker is not needed yet and the solution
for this can be postponed.

Keeping here as comment as it is not obvious where all the necessary helpers
live and how they should be connected. Might be useful for future reference.


import { fetchHelper } from '@proton/shared/lib/fetch/fetch';
import { createRefreshHandlers, getIsRefreshFailure, refresh } from '@proton/shared/lib/api/helpers/refreshHandlers';
import { setRefreshCookies } from '@proton/shared/lib/api/auth';
import { InactiveSessionError } from '@proton/shared/lib/api/errors';
import { withUIDHeaders, getUIDHeaderValue } from '@proton/shared/lib/fetch/headers';
import { getDateHeader } from '@proton/shared/lib/fetch/helpers';
import { APP_NAMES, RETRY_ATTEMPTS_MAX } from '@proton/shared/lib/constants';
import configureApi from '@proton/shared/lib/api';
import { getClientID } from '@proton/shared/lib/apps/helper';

function httpClient(config: {
    API_URL: string,
    APP_NAME: APP_NAMES,
    APP_VERSION: string,
}): ProtonDriveHTTPClient {
    const call = configureApi({
        ...config,
        // @ts-ignore
        clientID: getClientID(config.APP_NAME),
        xhr: fetchHelper,
    });

    const refreshHandler = createRefreshHandlers((UID) => {
        return refresh(() => call(withUIDHeaders(UID, setRefreshCookies())), 1, RETRY_ATTEMPTS_MAX);
    });

    let loggedOut = false;
    let UID;

    const fetch = async (request: Request, signal: AbortSignal): Promise<Response> => {
        try {
            await call({
                url: request.url,
                method: request.method,
                signal,
                data: request.body ? JSON.parse(await request.text()) : undefined,
            });
        } catch (error: unknown) {
            const { status, response } = error as any;

            if (status === HTTP_ERROR_CODES.UNAUTHORIZED) {
                // re-use withApiHandlers.js
            }
        }
    }

    return {
        fetch,
    }
}

*/
