import { EVENT_NOTIFIER_EVENTS_URL } from '../api/eventNotifier';

/**
 * Builds the SSE url of the event notifier from the api url, which is either relative
 * (`/api`, the usual web app setup) or absolute (`https://mail.proton.me/api`).
 *
 * Note that `EventSource` doesn't allow setting request headers, so what the API needs to
 * authenticate the request is passed as query parameters keyed by their header name instead.
 */
export const getEventNotifierUrl = ({
    apiUrl,
    origin,
    headers,
}: {
    apiUrl: string;
    origin: string;
    headers: Record<string, string>;
}) => {
    const url = new URL(`${apiUrl.replace(/\/+$/, '')}/${EVENT_NOTIFIER_EVENTS_URL}`, origin);
    url.search = new URLSearchParams(headers).toString();
    return url.toString();
};
