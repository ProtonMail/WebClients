import { parse } from 'tldts';
import type { Runtime } from 'webextension-polyfill';

import type { MaybeNull, TabId } from '@proton/pass/types';

import { isValidURL } from './is-valid-url';

export type ParsedUrl = {
    /* domain without suffix */
    displayName: MaybeNull<string>;
    /* widest top-level domain */
    domain: MaybeNull<string>;
    /* subdomain if any */
    subdomain: MaybeNull<string>;
    /* hostname of the url */
    hostname: MaybeNull<string>;
    /* protocol */
    protocol: MaybeNull<string>;
    /* url matches top-level domain */
    isTopLevelDomain: boolean;
    /* private domain from public suffix list */
    isPrivate: boolean;
    /* matches `https:` protocol */
    isSecure: boolean;
};

export const parseUrl = (url?: string): ParsedUrl => {
    const check = isValidURL(url ?? '');

    if (!check.valid) {
        return {
            displayName: null,
            domain: null,
            subdomain: null,
            protocol: null,
            hostname: null,
            isTopLevelDomain: false,
            isPrivate: false,
            isSecure: false,
        };
    }

    const { domain, subdomain, domainWithoutSuffix, hostname, isPrivate } = parse(url ?? '', {
        allowIcannDomains: true,
        allowPrivateDomains: true,
        detectIp: true,
    });

    return {
        displayName: domainWithoutSuffix ?? hostname,
        domain: domain ?? hostname /* fallback on hostname for localhost support */,
        subdomain: subdomain && subdomain !== 'www' ? hostname : null,
        protocol: check.protocol,
        hostname,
        isTopLevelDomain: !subdomain || subdomain === 'www',
        isPrivate: isPrivate ?? subdomain !== null,
        isSecure: check.url.startsWith('https://'),
    };
};

export const parseSender = (sender: Runtime.MessageSender): { tabId: TabId; url: ParsedUrl } => {
    const { url, tab } = sender;
    const parsedUrl = parseUrl(url ?? '');
    const tabId = tab?.id;

    if (!parsedUrl.domain || !tabId) throw new Error('unsupported sender');

    return { tabId, url: parsedUrl };
};
