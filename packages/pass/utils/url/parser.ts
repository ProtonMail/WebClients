import { parse } from 'tldts';

import type { MaybeNull } from '@proton/pass/types';

import { sanitizeURL } from './sanitize';
import type { ParsedUrl } from './types';

export const generateDomainCombinations = function* (domain: string, subdomain?: MaybeNull<string>) {
    if (!subdomain) {
        yield [domain];
        return;
    }

    const parts = subdomain.split('.').reverse();
    yield [domain, ...parts];

    while (parts.length > 0) {
        domain = `${parts.shift()}.${domain}`;
        yield [domain, ...parts];
    }
};

export const parseUrl = (url?: string, customPrivateDomains?: MaybeNull<Set<string>>): ParsedUrl => {
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

    let { domain, subdomain, domainWithoutSuffix, hostname, isPrivate, publicSuffix } = parse(url ?? '', {
        allowIcannDomains: true,
        allowPrivateDomains: true,
        detectIp: true,
    });

    if (customPrivateDomains && !isPrivate && domain) {
        for (const [nDomain, nSubdomain, ...rest] of generateDomainCombinations(domain, subdomain)) {
            if (customPrivateDomains.has(nDomain)) {
                domain = nSubdomain ? `${nSubdomain}.${nDomain}` : nDomain;
                domainWithoutSuffix = (() => {
                    if (nSubdomain) return nSubdomain;
                    if (!publicSuffix) return null;
                    return nDomain.replace(new RegExp(`\\.${publicSuffix}$`), '');
                })();
                subdomain = rest.join('.') || null;
                isPrivate = true;
                break;
            }
        }
    }

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
