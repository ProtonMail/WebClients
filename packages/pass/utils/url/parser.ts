import { parse } from 'tldts';
import type { Runtime } from 'webextension-polyfill';

import type { MaybeNull, RequiredNonNull, TabId } from '@proton/pass/types';

import { isValidURL } from './is-valid-url';

export type ParsedUrl = {
    /* domain without suffix */
    displayName: MaybeNull<string>;
    /* widest top-level domain */
    domain: MaybeNull<string>;
    /* subdomain if any */
    subdomain: MaybeNull<string>;
    /* hostname of the URL */
    hostname: MaybeNull<string>;
    /* protocol */
    protocol: MaybeNull<string>;
    /* URL matches top-level domain */
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

type ParsedSenderUrl = RequiredNonNull<ParsedUrl, 'domain' | 'protocol'>;

export type ParsedSender = { tabId: TabId; url: ParsedSenderUrl };

const isSupportedSenderUrl = (parsedUrl: ParsedUrl): parsedUrl is ParsedSenderUrl =>
    parsedUrl.domain !== null && parsedUrl.protocol !== null;

/* Safely parses the sender information, providing compatibility
 * for non-Chromium browsers: if available, uses the MessageSender origin
 * property for enhanced protection against compromised renderer spoofing. */
export const parseSender = (sender: Runtime.MessageSender): ParsedSender => {
    const origin = (sender as any)?.origin;
    const { url, tab } = sender;
    const parsedUrl = parseUrl(origin ?? url ?? '');
    const tabId = tab?.id;

    if (!isSupportedSenderUrl(parsedUrl) || !tabId) throw new Error('Unsupported sender');

    return { tabId, url: parsedUrl };
};
