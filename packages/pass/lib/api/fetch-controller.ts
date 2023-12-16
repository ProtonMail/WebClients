import type { Maybe } from '@proton/pass/types';

export type AbortableFetchHandler = (event: FetchEvent, signal: AbortSignal) => Maybe<Promise<Response>>;

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
         * request, call the `FetchController::abort` with the absolute request url. */
        register:
            (handler: AbortableFetchHandler) =>
            (event: FetchEvent): void => {
                const requestUrl = event.request.url;
                const controller = new AbortController();
                controllers.set(requestUrl, controller);

                const res = handler(event, controller.signal);
                if (res !== undefined) event.respondWith(res.finally(() => controllers.delete(requestUrl)));
            },
    };
};

export const fetchController = fetchControllerFactory();
