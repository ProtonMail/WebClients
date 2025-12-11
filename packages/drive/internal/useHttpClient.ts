import { useRef } from 'react';

import type {
    ProtonDriveHTTPClient,
    ProtonDriveHTTPClientBlobRequest,
    ProtonDriveHTTPClientJsonRequest,
} from '@protontech/drive-sdk';
import { AbortError } from '@protontech/drive-sdk';

import useApi from '@proton/components/hooks/useApi';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { PROTON_LOCAL_DOMAIN } from '@proton/shared/lib/localDev';

import { withTimeout } from './withTimeout';

// TODO: include SDK version with commit hash
export function useHttpClient(defaultHeaders: [string, string][] = []): ProtonDriveHTTPClient {
    const api = useApi();

    const fetchJson = async (options: ProtonDriveHTTPClientJsonRequest) => {
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
    const fetchBlob = async (options: ProtonDriveHTTPClientBlobRequest) => {
        // We need to create a new object to avoid mutating the original object.
        // If the original object is mutated, the retry will use modified options.
        options = { ...options };

        options.url = replaceLocalURL(options.url);
        options.headers = new Headers([...defaultHeaders, ...options.headers.entries()]);

        const { signalWithTimeout, callWithTimeout } = withTimeout(options.timeoutMs, options.signal);

        options.signal = signalWithTimeout;

        // Fetch API doesn't support providing progress events for uploading,
        // so we need to use XMLHttpRequest for that.
        if (options.method === 'POST') {
            return callWithTimeout(postXmlHttpRequest(options));
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

async function postXmlHttpRequest(options: ProtonDriveHTTPClientBlobRequest) {
    let listener: () => void;

    return new Promise<Response>((resolve, reject) => {
        if (options.signal?.aborted) {
            reject(new AbortError());
            return;
        }

        const xhr = new XMLHttpRequest();

        let lastLoaded = 0;
        let total = 0;
        xhr.upload.onprogress = (e) => {
            total = e.total;
            options.onProgress?.(e.loaded - lastLoaded);
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
            resolve(
                new Response(xhr.response, {
                    status: xhr.status,
                    statusText: xhr.response?.Error || xhr.statusText || xhr.response,
                })
            );
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
