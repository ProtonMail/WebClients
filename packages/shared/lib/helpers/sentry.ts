import {
    captureException,
    configureScope,
    init,
    makeFetchTransport,
    captureMessage as sentryCaptureMessage,
} from '@sentry/browser';
import { BrowserTransportOptions } from '@sentry/browser/types/transports/types';

import { VPN_HOSTNAME } from '../constants';
import { ApiError } from '../fetch/ApiError';
import { getUIDHeaders } from '../fetch/headers';
import { ProtonConfig } from '../interfaces';

const isLocalhost = (host: string) => host.startsWith('localhost');

const isProduction = (host: string) => host.endsWith('.proton.me') || host === VPN_HOSTNAME;

let authHeaders: { [key: string]: string } = {};

export const setUID = (uid: string | undefined) => {
    if (!uid) {
        authHeaders = {};
        return;
    }
    authHeaders = {
        ...getUIDHeaders(uid),
    };
};

const getContentTypeHeaders = (input: RequestInfo | URL): HeadersInit => {
    const url = input.toString();
    /**
     * The sentry library does not append the content-type header to requests. The documentation states
     * what routes accept what content-type. Those content-type headers are also expected through our sentry tunnel.
     */
    if (url.includes('/envelope/')) {
        return {
            'content-type': 'application/x-sentry-envelope',
        };
    }
    if (url.includes('/store/')) {
        return {
            'content-type': 'application/json',
        };
    }
    return {};
};

const sentryFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    return window.fetch(input, {
        ...init,
        headers: {
            ...init?.headers,
            ...getContentTypeHeaders(input),
            ...authHeaders,
        },
    });
};

const makeProtonFetchTransport = (options: BrowserTransportOptions) => {
    return makeFetchTransport(options, sentryFetch);
};

interface Arguments {
    sessionTracking?: boolean;
    config: Pick<ProtonConfig, 'SENTRY_DSN' | 'COMMIT' | 'APP_VERSION'>;
    uid?: string;
}

let sentryEnabled = true;

function main({ config: { SENTRY_DSN, COMMIT, APP_VERSION }, uid, sessionTracking = false }: Arguments) {
    const { host } = window.location;

    // No need to configure it if we don't load the DSN
    if (!SENTRY_DSN || isLocalhost(host)) {
        return;
    }

    setUID(uid);

    // Assumes SENTRY_DSN is: https://111b3eeaaec34cae8e812df705690a36@sentry/11
    // To get https://111b3eeaaec34cae8e812df705690a36@protonmail.com/api/core/v4/reports/sentry/11
    const dsn = SENTRY_DSN.replace('sentry', `${host}/api/core/v4/reports/sentry`);

    init({
        dsn,
        release: isProduction(host) ? APP_VERSION : COMMIT,
        environment: host.split('.').splice(1).join('.'),
        normalizeDepth: 5,
        transport: makeProtonFetchTransport,
        autoSessionTracking: sessionTracking,
        // Disable client reports. Client reports are used by sentry to retry events that failed to send on visibility change.
        // Unfortunately Sentry does not use the custom transport for those, and thus fails to add the headers the API requires.
        sendClientReports: false,
        beforeSend(event, hint) {
            const error = hint?.originalException;
            const stack = typeof error === 'string' ? error : error?.stack;
            // Filter out broken ferdi errors
            if (stack && stack.match(/ferdi|franz/i)) {
                return null;
            }

            // Not interested in uncaught API errors
            if (error instanceof ApiError) {
                return null;
            }

            if (!sentryEnabled) {
                return null;
            }

            // Remove the hash from the request URL and navigation breadcrumbs to avoid
            // leaking the search parameters of encrypted searches
            if (event.request && event.request.url) {
                [event.request.url] = event.request.url.split('#');
            }
            if (event.breadcrumbs) {
                event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
                    if (breadcrumb.category === 'navigation' && breadcrumb.data) {
                        [breadcrumb.data.from] = breadcrumb.data.from.split('#');
                        [breadcrumb.data.to] = breadcrumb.data.to.split('#');
                    }
                    return breadcrumb;
                });
            }

            return event;
        },
        ignoreErrors: [
            // Ignore random plugins/extensions
            'top.GLOBALS',
            'canvas.contentDocument',
            'MyApp_RemoveAllHighlights',
            'atomicFindClose',
            'conduitPage',
            // https://bugzilla.mozilla.org/show_bug.cgi?id=1678243
            'XDR encoding failure',
            'Request timed out',
            'No network connection',
            'Failed to fetch',
            'NetworkError when attempting to fetch resource.',
            'webkitExitFullScreen', // Bug in Firefox for iOS.
            'InactiveSession',
            'UnhandledRejection', // Happens too often in extensions and we have lints for that, so should be safe to ignore.
            /chrome-extension/,
            /moz-extension/,
            'TransferCancel', // User action to interrupt upload or download in Drive.
            'UploadConflictError', // User uploading the same file again in Drive.
            'UploadUserError', // Upload error on user's side in Drive.
            'ValidationError', // Validation error on user's side in Drive.
            'ChunkLoadError', // WebPack loading source code.
            /ResizeObserver loop/, // Chromium bug https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
        ],
    });

    configureScope((scope) => {
        scope.setTag('appVersion', APP_VERSION);
    });
}

export const traceError = (...args: Parameters<typeof captureException>) => {
    if (!isLocalhost(window.location.host)) {
        captureException(...args);
    }
};

export const captureMessage = (...args: Parameters<typeof sentryCaptureMessage>) => {
    if (!isLocalhost(window.location.host)) {
        sentryCaptureMessage(...args);
    }
};

export const setSentryEnabled = (enabled: boolean) => {
    sentryEnabled = enabled;
};

export default main;
