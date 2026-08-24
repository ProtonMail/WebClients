import type { APP_NAMES } from '../../constants';
import { getSecondLevelDomain } from '../../helpers/url';
import { getValidatedProtonProtocol } from './getValidatedProtonProtocol';

export const getIsLocalhostRedirectUrl = ({ protocol, hostname }: URL) => {
    return protocol === 'http:' && hostname === 'localhost';
};

export const getValidatedRedirectUrl = ({ redirectUrl, app, url }: { redirectUrl: URL; url: URL; app: APP_NAMES }) => {
    const protocol = getValidatedProtonProtocol(app, redirectUrl.href);
    if (protocol) {
        return new URL(`${protocol}//${url.pathname.slice(1)}${url.search}${url.hash}`);
    }

    // Copy, so that the caller's url is not mutated below
    const parsedRedirectUrl = new URL(redirectUrl);

    if (parsedRedirectUrl.pathname === '/') {
        parsedRedirectUrl.pathname = url.pathname;
    }
    parsedRedirectUrl.search = url.search;
    parsedRedirectUrl.hash = url.hash;

    // Allow only http for localhost
    if (getIsLocalhostRedirectUrl(parsedRedirectUrl)) {
        return parsedRedirectUrl;
    }
    // Protocol must be https, if not localhost
    if (parsedRedirectUrl.protocol !== 'https:') {
        return;
    }
    // Must stay on the same subdomain
    if (getSecondLevelDomain(parsedRedirectUrl.hostname) !== getSecondLevelDomain(url.hostname)) {
        return;
    }
    // Must be prefixed with `new-` or keep same
    if (`new-${url.hostname}` === parsedRedirectUrl.hostname || url.hostname === parsedRedirectUrl.hostname) {
        return parsedRedirectUrl;
    }
};
