const API_SUBDOMAIN_SUFFIX = '-api';

/**
 * Inverse of the `-api` subdomain transform applied by `getApiSubdomainUrl`.
 *
 * The Chargebee iframe is served from the API subdomain (e.g. `mail-api.proton.me`),
 * while its parent window is the app served from the plain subdomain (e.g. `mail.proton.me`).
 * This strips the `-api` suffix from the first hostname label so the iframe can target the
 * exact parent origin in `postMessage` instead of a wildcard.
 */
export const getParentOrigin = (iframeOrigin: string): string => {
    const url = new URL(iframeOrigin);

    const dotIndex = url.hostname.indexOf('.');
    const firstLabel = dotIndex === -1 ? url.hostname : url.hostname.slice(0, dotIndex);
    const rest = dotIndex === -1 ? '' : url.hostname.slice(dotIndex);

    if (firstLabel.length > API_SUBDOMAIN_SUFFIX.length && firstLabel.endsWith(API_SUBDOMAIN_SUFFIX)) {
        url.hostname = firstLabel.slice(0, -API_SUBDOMAIN_SUFFIX.length) + rest;
    }

    return url.origin;
};
