import type { Maybe, MaybeNull } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { PassErrorCode } from './errors';

export type AbortableFetchHandler = (event: FetchEvent, signal: AbortSignal) => Maybe<Promise<Response>>;
export type FetchHandlerOptions = { unauthenticated?: boolean };
export type FetchControllerConfig = { protocols?: string[]; hostnames?: string[] };

const getFetchEventHeader =
    (header: string) =>
    (event: FetchEvent): MaybeNull<string> => {
        const requestHeaders = event.request.headers;
        return requestHeaders.get(header);
    };

export const getUID = getFetchEventHeader('X-Pm-Uid');
export const getRequestID = getFetchEventHeader('X-Pass-Worker-RequestID');

/** `X-Pass-Worker-RequestID` should not be sent back-end side,
 * it is only used to identify requests service-worker side in
 * order to properly abort them */
export const getRequestIDHeaders = (init?: HeadersInit): [Record<string, string>, string] => {
    const headers = new Headers(init);
    const requestId = uniqueId();
    headers.append('X-Pass-Worker-RequestID', requestId);

    return [Object.fromEntries(headers.entries()), requestId];
};

export const createAbortResponse = () =>
    new Response('Aborted', {
        status: 499,
        statusText: 'Abort error',
        headers: { 'Content-Type': 'text/plain' },
    });

export const createEmptyResponse = (res?: Response) =>
    new Response('Empty', {
        status: res?.status ?? 204,
        statusText: res?.statusText ?? 'No content',
        headers: res?.headers ?? { 'Content-Type': 'text/plain' },
    });

/** Service-worker network errors should conform to the
 * API error response format in order to conform to client
 * side error handlers. As our service-worker fetch handler
 * acts as some kind of proxy, if we cannot reach */
export const createNetworkError = (status: number = 503) =>
    new Response(JSON.stringify({ Error: 'Network error', Code: PassErrorCode.SERVICE_NETWORK_ERROR }), {
        status,
        statusText: 'Network error',
        headers: { 'Content-Type': 'application/json' },
    });

/** Fetch event handler factory with custom abort controller management. Allows using
 * service-worker messages to trigger abort controllers for client-side cancellation. */
export const fetchControllerFactory = (config?: FetchControllerConfig) => {
    const controllers = new Map<string, AbortController>();

    return {
        _controllers: controllers,

        /** Aborts any initiated fetch request for the supplied `requestId` */
        abort: (requestId: string) => controllers.get(requestId)?.abort?.('cancelled'),

        fetch: (req: Request, signal?: AbortSignal): Promise<Response> => {
            const request = new Request(req);
            request.headers.delete('X-Pass-Worker-RequestID');
            return fetch(request, { signal }).catch((err) => {
                if (err?.name === 'AbortError') return createAbortResponse();
                throw err;
            });
        },

        /** Registers an abortable fetch event handler. In order to cancel a
         * request, call the `FetchController::abort` with the appropriate requestId.
         * By default, fetch handlers will be wrapped with a UID header check - if you
         * need to bypass the UID header check use the `unauthenticated` flag. */
        register:
            (handler: AbortableFetchHandler, options?: FetchHandlerOptions) =>
            (event: FetchEvent): void => {
                const requestUrl = event.request.url;
                const { protocol, hostname } = new URL(requestUrl);

                if (config?.protocols && !config.protocols.includes(protocol)) return;
                if (config?.hostnames && !config.hostnames.includes(hostname)) return;

                if (options?.unauthenticated || getUID(event)) {
                    const requestId = getRequestID(event) ?? requestUrl;

                    const controller = new AbortController();
                    controllers.set(requestId, controller);

                    const res = handler(event, controller.signal)
                        ?.then((res) => res.clone())
                        .finally(() => controllers.delete(requestId));

                    if (res !== undefined) event.respondWith(res);
                    else controllers.delete(requestId);
                }
            },
    };
};

export type FetchController = ReturnType<typeof fetchControllerFactory>;
