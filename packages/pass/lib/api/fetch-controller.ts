import type { Maybe, MaybeNull } from '@proton/pass/types';

export type AbortableFetchHandler = (event: FetchEvent, signal: AbortSignal) => Maybe<Promise<Response>>;
type FetchHandlerOptions = { unauthenticated?: boolean };

export const getUID = (event: FetchEvent): MaybeNull<string> => {
    const requestHeaders = event.request.headers;
    return requestHeaders.get('X-Pm-Uid');
};

/** Fetch event handler factory with custom abort controller management. Allows using
 * service-worker messages to trigger abort controllers for client-side cancellation. */
const fetchControllerFactory = () => {
    const controllers = new Map<string, AbortController>();

    return {
        /** Aborts any initiated fetch request for the supplied `requestUrl`.
         * `requestUrl` must be an absolute url with protocol included to correctly
         * match the underlying abort controller */
        abort: (requestUrl: string) => controllers.get(requestUrl)?.abort?.(),
        /** Registers an abortable fetch event handler. In order to cancel a
         * request, call the `FetchController::abort` with the absolute request url.
         * By default, fetch handlers will be wrapped with a UID header check - if you
         * need to handle unauthenticated requests use the `unauthenticated` flag. */
        register:
            (handler: AbortableFetchHandler, options?: FetchHandlerOptions) =>
            (event: FetchEvent): void => {
                if (options?.unauthenticated || getUID(event)) {
                    const requestUrl = event.request.url;
                    const controller = new AbortController();
                    controllers.set(requestUrl, controller);

                    const res = handler(event, controller.signal)?.then((res) => res.clone());
                    if (res !== undefined) event.respondWith(res.finally(() => controllers.delete(requestUrl)));
                    else controllers.delete(requestUrl);
                }
            },
    };
};

export const fetchController = fetchControllerFactory();
