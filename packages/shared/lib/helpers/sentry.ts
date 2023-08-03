import {
    BrowserOptions,
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

type SentryContext = {
    authHeaders: { [key: string]: string };
    enabled: boolean;
};

type SentryConfig = {
    host: string;
    release: string;
    environment: string;
};

type SentryDenyUrls = BrowserOptions['denyUrls'];
type SentryIgnoreErrors = BrowserOptions['ignoreErrors'];

type SentryOptions = {
    sessionTracking?: boolean;
    config: ProtonConfig;
    uid?: string;
    sentryConfig?: SentryConfig;
    ignore?: (config: SentryConfig) => boolean;
    denyUrls?: SentryDenyUrls;
    ignoreErrors?: SentryIgnoreErrors;
};

const context: SentryContext = {
    authHeaders: {},
    enabled: true,
};

export const setUID = (uid: string | undefined) => {
    context.authHeaders = uid ? getUIDHeaders(uid) : {};
};

export const setSentryEnabled = (enabled: boolean) => {
    context.enabled = enabled;
};

export const getContentTypeHeaders = (input: RequestInfo | URL): HeadersInit => {
    const url = input.toString();
    /**
     * The sentry library does not append the content-type header to requests. The documentation states
     * what routes accept what content-type. Those content-type headers are also expected through our sentry tunnel.
     */
    if (url.includes('/envelope/')) {
        return { 'content-type': 'application/x-sentry-envelope' };
    }

    if (url.includes('/store/')) {
        return { 'content-type': 'application/json' };
    }

    return {};
};

const sentryFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    return globalThis.fetch(input, {
        ...init,
        headers: {
            ...init?.headers,
            ...getContentTypeHeaders(input),
            ...context.authHeaders,
        },
    });
};

const makeProtonFetchTransport = (options: BrowserTransportOptions) => {
    return makeFetchTransport(options, sentryFetch);
};

const isLocalhost = (host: string) => host.startsWith('localhost');
const isProduction = (host: string) => host.endsWith('.proton.me') || host === VPN_HOSTNAME;

const getDefaultSentryConfig = ({ APP_VERSION, COMMIT }: ProtonConfig): SentryConfig => {
    const { host } = window.location;
    return {
        host,
        release: isProduction(host) ? APP_VERSION : COMMIT,
        environment: host.split('.').splice(1).join('.'),
    };
};

const getDefaultDenyUrls = (): SentryDenyUrls => {
    return [
        // Google Adsense
        /pagead\/js/i,
        // Facebook flakiness
        /graph\.facebook\.com/i,
        // Facebook blocked
        /connect\.facebook\.net\/en_US\/all\.js/i,
        // Woopra flakiness
        /eatdifferent\.com\.woopra-ns\.com/i,
        /static\.woopra\.com\/js\/woopra\.js/i,
        // Chrome extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        // Other plugins
        /127\.0\.0\.1:4001\/isrunning/i, // Cacaoweb
        /webappstoolbarba\.texthelp\.com\//i,
        /metrics\.itunes\.apple\.com\.edgesuite\.net\//i,
    ];
};

const getDefaultIgnoreErrors = (): SentryIgnoreErrors => {
    return [
        // Ignore random plugins/extensions
        'top.GLOBALS',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'atomicFindClose',
        // See http://toolbar.conduit.com/Developer/HtmlAndGadget/Methods/JSInjection.aspx
        'conduitPage',
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1678243
        'XDR encoding failure',
        'Request timed out',
        'No network connection',
        'Failed to fetch',
        'Load failed',
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
        // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
        'originalCreateNotification',
        'http://tt.epicplay.com',
        "Can't find variable: ZiteReader",
        'jigsaw is not defined',
        'ComboSearch is not defined',
        'http://loading.retry.widdit.com/',
        // Facebook borked
        'fb_xd_fragment',
        // ISP "optimizing" proxy - `Cache-Control: no-transform` seems to reduce this. (thanks @acdha)
        // See http://stackoverflow.com/questions/4113268/how-to-stop-javascript-injection-from-vodafone-proxy
        'bmi_SafeAddOnload',
        'EBCallBackMessageReceived',
        // Avast extension error
        '_avast_submit',
        'AbortError',
    ];
};

function main({
    uid,
    config,
    sessionTracking = false,
    sentryConfig = getDefaultSentryConfig(config),
    ignore = ({ host }) => isLocalhost(host),
    denyUrls = getDefaultDenyUrls(),
    ignoreErrors = getDefaultIgnoreErrors(),
}: SentryOptions) {
    const { SENTRY_DSN, APP_VERSION } = config;
    const { host, release, environment } = sentryConfig;

    // No need to configure it if we don't load the DSN
    if (!SENTRY_DSN || ignore(sentryConfig)) {
        return;
    }

    setUID(uid);

    // Assumes SENTRY_DSN is: https://111b3eeaaec34cae8e812df705690a36@sentry/11
    // To get https://111b3eeaaec34cae8e812df705690a36@protonmail.com/api/core/v4/reports/sentry/11
    const dsn = SENTRY_DSN.replace('sentry', `${host}/api/core/v4/reports/sentry`);

    init({
        dsn,
        release,
        environment,
        normalizeDepth: 5,
        transport: makeProtonFetchTransport,
        autoSessionTracking: sessionTracking,
        // Disable client reports. Client reports are used by sentry to retry events that failed to send on visibility change.
        // Unfortunately Sentry does not use the custom transport for those, and thus fails to add the headers the API requires.
        sendClientReports: false,
        beforeSend(event, hint) {
            const error = hint?.originalException as any;
            const stack = typeof error === 'string' ? error : error?.stack;
            // Filter out broken ferdi errors
            if (stack && stack.match(/ferdi|franz/i)) {
                return null;
            }

            // Not interested in uncaught API errors, or known errors
            if (error instanceof ApiError || error?.trace === false) {
                return null;
            }

            if (!context.enabled) {
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
        // Some ignoreErrors and denyUrls are taken from this gist: https://gist.github.com/Chocksy/e9b2cdd4afc2aadc7989762c4b8b495a
        // This gist is suggested in the Sentry documentation: https://docs.sentry.io/clients/javascript/tips/#decluttering-sentry
        ignoreErrors,
        denyUrls,
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

export default main;
