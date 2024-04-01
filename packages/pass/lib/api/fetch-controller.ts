import type { Maybe, MaybeNull } from '@proton/pass/types';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

export type AbortableFetchHandler = (event: FetchEvent, signal: AbortSignal) => Maybe<Promise<Response>>;
type FetchHandlerOptions = { unauthenticated?: boolean };

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

/** Fetch event handler factory with custom abort controller management. Allows using
 * service-worker messages to trigger abort controllers for client-side cancellation. */
export const fetchControllerFactory = () => {
    const controllers = new Map<string, AbortController>();

    return {
        _controllers: controllers,

        /** Aborts any initiated fetch request for the supplied `requestId` */
        abort: (requestId: string) => controllers.get(requestId)?.abort?.(),

        fetch: (req: Request, signal?: AbortSignal): Promise<Response> => {
            const request = new Request(req);
            request.headers.delete('X-Pass-Worker-RequestID');
            return fetch(request, { signal });
        },

        /** Registers an abortable fetch event handler. In order to cancel a
         * request, call the `FetchController::abort` with the appropriate requestId.
         * By default, fetch handlers will be wrapped with a UID header check - if you
         * need to bypass the UID header check use the `unauthenticated` flag. */
        register:
            (handler: AbortableFetchHandler, options?: FetchHandlerOptions) =>
            (event: FetchEvent): void => {
                if (options?.unauthenticated || getUID(event)) {
                    const requestUrl = event.request.url;
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
export const fetchController = fetchControllerFactory();
