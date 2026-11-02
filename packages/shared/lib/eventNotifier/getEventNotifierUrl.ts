import { EVENT_NOTIFIER_EVENTS_URL } from '../api/eventNotifier';

/**
 * Builds the SSE url of the event notifier from the api url, which is either relative
 * (`/api`, the usual web app setup) or absolute (`https://mail.proton.me/api`).
 */
export const getEventNotifierUrl = ({ apiUrl, origin }: { apiUrl: string; origin: string }) => {
    return new URL(`${apiUrl.replace(/\/+$/, '')}/${EVENT_NOTIFIER_EVENTS_URL}`, origin).toString();
};

/**
 * `EventSource` doesn't allow setting request headers, so the connection is authenticated with a
 * connection token passed as a query parameter instead, see `getEventNotifierConnectionToken`.
 */
export const getEventNotifierConnectionUrl = (url: string, connectionToken: string) => {
    const connectionUrl = new URL(url);
    connectionUrl.searchParams.set('ConnectionToken', connectionToken);
    return connectionUrl.toString();
};
