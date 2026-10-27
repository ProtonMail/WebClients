import type { APP_NAMES } from '../../constants';
import { getSecondLevelDomain } from '../../helpers/url';
import { getValidatedProtonProtocol } from './getValidatedProtonProtocol';

export const getIsLocalhostRedirectUrl = ({ protocol, hostname }: URL) => {
    return protocol === 'http:' && hostname === 'localhost';
};

declare const validated: unique symbol;

/** A redirect url that `getValidatedRedirectUrl` accepted; only it creates one. */
export interface ValidatedRedirectUrl {
    readonly url: URL;
    /** Which screen the user confirms it on, when it leaves the Proton domain: a proton:// app or localhost. */
    readonly consent: 'desktop' | 'redirect' | undefined;
    readonly [validated]: true;
}

const getIsSameDomainRedirectUrl = (redirectUrl: URL, url: URL) =>
    redirectUrl.protocol === 'https:' &&
    getSecondLevelDomain(redirectUrl.hostname) === getSecondLevelDomain(url.hostname) &&
    // The same hostname or its `new-` prefixed one
    (`new-${url.hostname}` === redirectUrl.hostname || url.hostname === redirectUrl.hostname);

/** The redirect url, if the fork may go to it; `url` is the app's fork url, whose hostname it is checked against. */
export const getValidatedRedirectUrl = ({
    redirectUrl,
    app,
    url,
}: {
    redirectUrl: URL;
    url: URL;
    app: APP_NAMES;
}): ValidatedRedirectUrl | undefined => {
    if (getIsSameDomainRedirectUrl(redirectUrl, url)) {
        return { url: new URL(redirectUrl), consent: undefined } as ValidatedRedirectUrl;
    }
    if (getValidatedProtonProtocol(app, redirectUrl.href)) {
        return { url: new URL(redirectUrl), consent: 'desktop' } as ValidatedRedirectUrl;
    }
    if (getIsLocalhostRedirectUrl(redirectUrl)) {
        return { url: new URL(redirectUrl), consent: 'redirect' } as ValidatedRedirectUrl;
    }
};

/** Where the fork goes for a validated redirect url: its address, with the fork url's path, search and hash. */
export const getRedirectForkUrl = ({
    redirectUrl,
    app,
    url,
}: {
    redirectUrl: ValidatedRedirectUrl;
    url: URL;
    app: APP_NAMES;
}) => {
    const protocol = getValidatedProtonProtocol(app, redirectUrl.url.href);
    if (protocol) {
        return new URL(`${protocol}//${url.pathname.slice(1)}${url.search}${url.hash}`);
    }

    // Copy, so that the caller's url is not mutated below
    const forkUrl = new URL(redirectUrl.url);
    if (forkUrl.pathname === '/') {
        forkUrl.pathname = url.pathname;
    }
    forkUrl.search = url.search;
    forkUrl.hash = url.hash;
    return forkUrl;
};
