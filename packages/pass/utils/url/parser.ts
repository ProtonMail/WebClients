import { parse } from 'tldts';
import type { Runtime } from 'webextension-polyfill';

import { sanitizeURL } from './sanitize';
import type { ParsedSender, ParsedUrl } from './types';
import { isSupportedSenderUrl } from './utils';

export const parseUrl = (url?: string): ParsedUrl => {
    const check = sanitizeURL(url ?? '');

    if (!check.valid) {
        return {
            displayName: null,
            domain: null,
            subdomain: null,
            protocol: null,
            port: null,
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
        port: check.port,
        hostname,
        isTopLevelDomain: !subdomain || subdomain === 'www',
        isPrivate: isPrivate ?? subdomain !== null,
        isSecure: check.url.startsWith('https://'),
    };
};

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
