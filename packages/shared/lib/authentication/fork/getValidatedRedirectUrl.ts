import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';

import { type APP_NAMES, PROTON_DOMAINS } from '../../constants';
import { getValidatedProtonProtocol } from './getValidatedProtonProtocol';

export const getValidatedRedirectUrl = ({
    redirectUrl,
    app,
    url,
}: {
    redirectUrl: string;
    url: URL;
    app: APP_NAMES;
}) => {
    const protocol = getValidatedProtonProtocol(app, redirectUrl);
    if (protocol) {
        return new URL(`${protocol}//${url.pathname.slice(1)}${url.search}${url.hash}`);
    }
    if (redirectUrl && URL.canParse(redirectUrl)) {
        const parsedRedirectUrl = new URL(redirectUrl);

        if (parsedRedirectUrl.pathname === '/') {
            parsedRedirectUrl.pathname = url.pathname;
        }
        parsedRedirectUrl.search = url.search;
        parsedRedirectUrl.hash = url.hash;

        // Allow only http for localhost
        if (parsedRedirectUrl.protocol === 'http:' && parsedRedirectUrl.hostname === 'localhost') {
            // But not on production domains
            const currentDomain = getSecondLevelDomain(url.hostname);
            if (PROTON_DOMAINS.some((protonDomain) => protonDomain === currentDomain)) {
                return;
            }
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
    }
};
