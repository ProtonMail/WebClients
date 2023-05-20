import { parse } from 'tldts';
import type { Runtime } from 'webextension-polyfill';

import { isValidURL } from './is-valid-url';

export const parseUrl = (url?: string) => {
    const check = isValidURL(url ?? '');

    if (!check.valid) {
        return {
            domain: null,
            domainName: null,
            subdomain: null,
            isTopLevelDomain: false,
        };
    }

    const { domain, subdomain, domainWithoutSuffix, hostname } = parse(url ?? '');

    return {
        domain: domain ?? hostname /* fallback on hostname for localhost support */,
        domainName: domainWithoutSuffix,
        subdomain: subdomain && subdomain !== 'www' ? hostname : null,

        isTopLevelDomain: !subdomain || subdomain === 'www',
    };
};

export const parseSender = (sender: Runtime.MessageSender) => {
    const { url, tab } = sender;
    const { domain: realm, subdomain } = parseUrl(url ?? '');
    const tabId = tab?.id;

    if (!realm || !tabId) {
        throw new Error('unsupported sender');
    }

    return {
        tabId,
        realm,
        subdomain,
        url: url as string,
    };
};
