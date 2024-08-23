import { stripLeadingSlash, stripTrailingSlash } from '@proton/shared/lib/helpers/string';

import type { APP_NAMES } from '../constants';
import { VPN_HOSTNAME } from '../constants';
import { APPS, APPS_CONFIGURATION, DOH_DOMAINS, LINK_TYPES } from '../constants';
import window from '../window';

const PREFIX_TO_TYPE: { [prefix: string]: LINK_TYPES | undefined } = {
    'tel:': LINK_TYPES.PHONE,
    'mailto:': LINK_TYPES.EMAIL,
    'http://': LINK_TYPES.WEB,
    'https://': LINK_TYPES.WEB,
};

const SUPPORTED_PROTOCOLS = [
    /* extension protocols */
    'chrome-extension:',
    'moz-extension:',
    /* bundled electron apps */
    'file:',
];

const TYPE_TO_PREFIX = {
    [LINK_TYPES.PHONE]: { regex: /^tel:/, defaultPrefix: 'tel:' },
    [LINK_TYPES.EMAIL]: { regex: /^mailto:/, defaultPrefix: 'mailto:' },
    [LINK_TYPES.WEB]: { regex: /^http(|s):\/\//, defaultPrefix: 'https://' },
};

export type ParsedSearchParams = Partial<Record<string, string>>;

// Create one big regexp of all the regexes in TYPE_TO_PREFIX.
// It can be used for finding a particular type from a link.
const ALL_REGEXP_SOURCES = (Object.keys(TYPE_TO_PREFIX) as LINK_TYPES[])
    .map((key) => `(${TYPE_TO_PREFIX[key].regex.source})`)
    .join('|');

const ALL_REGEXP = new RegExp(ALL_REGEXP_SOURCES);

/**
 * Extract host
 * @param url
 * @returns host
 */
export const getHost = (url = '') => {
    const { host = '' } = new URL(url);
    return host;
};

/**
 * Extract hostname
 * @param url
 * @returns hostname
 */
export const getHostname = (url = '') => {
    const { hostname = '' } = new URL(url);
    return hostname;
};

/**
 * Converts search parameters from hash to a URLSearchParams compatible string
 */
const getSearchFromHash = (search: string) => {
    let searchHash = search;
    if (searchHash) {
        searchHash = searchHash[0] === '#' ? `?${search.slice(1)}` : searchHash;
    }
    return searchHash;
};

export const stringifySearchParams = (
    params: { [key: string]: string | string[] | undefined },
    prefix?: string | undefined
) => {
    const urlSearchParams = new URLSearchParams();

    Object.entries(params)
        .filter(([, value]) => value !== undefined && value !== '')
        .forEach(([key, value]) => {
            /*
             * typescript is not able to determine that stringifiedValue
             * can't be undefined because of the previous filter condition
             * therefore, typecast to string
             */
            const stringifiedValue = Array.isArray(value) ? value.join(',') : (value as string);

            urlSearchParams.set(key, stringifiedValue);
        });

    const urlSearch = urlSearchParams.toString();

    return urlSearch !== '' && prefix !== undefined ? prefix + urlSearch : urlSearch;
};

/**
 * Return a param (native) map based on the search string
 */
export const getSearchParams = (search: string): ParsedSearchParams => {
    const params = new URLSearchParams(getSearchFromHash(search));

    const result: ParsedSearchParams = {};

    params.forEach((value, key) => {
        result[key] = value;
    });

    return result;
};

/**
 * Return a new pathname with the query string updated from
 * the search input and updated with the newParams
 */
export const changeSearchParams = (pathname: string, search: string, newParams: ParsedSearchParams = {}) => {
    const params = new URLSearchParams(getSearchFromHash(search));

    Object.keys(newParams).forEach((key) => {
        if (newParams[key] === undefined) {
            params.delete(key);
        } else {
            params.set(key, newParams[key] as string);
        }
    });

    // Remove potential mailto query from the params, otherwise search will be concatenated to the mailto query
    if (params.get('mailto')) {
        params.delete('mailto');
    }

    const queryString = params.toString();
    const urlFragment = (queryString === '' ? '' : '#') + queryString;

    return pathname + urlFragment;
};

/**
 * Convert from a link prefix to link type.
 */
const prefixToType = (prefix = 'http://') => {
    return PREFIX_TO_TYPE[prefix];
};

/**
 * Get a link prefix from a url.
 */
const getLinkPrefix = (input = ''): string | undefined => {
    const matches = ALL_REGEXP.exec(input) || [];
    return matches[0];
};

/**
 * Get a link type from a link.
 */
export const linkToType = (link = '') => {
    const prefix = getLinkPrefix(link);
    return prefixToType(prefix);
};

/**
 * Strip the link prefix from a url.
 * Leave the prefix if it's http to let the user be able to set http or https.
 */
export const stripLinkPrefix = (input = '') => {
    const prefix = getLinkPrefix(input);
    if (!prefix || prefix.indexOf('http') !== -1) {
        return input;
    }
    return input.replace(prefix, '');
};

/**
 * Try to add link prefix if missing
 */
export const addLinkPrefix = (input = '', type: LINK_TYPES) => {
    const prefix = getLinkPrefix(input);

    if (prefix) {
        return input;
    }

    const { defaultPrefix } = TYPE_TO_PREFIX[type] || {};

    if (defaultPrefix) {
        return `${defaultPrefix}${input}`;
    }

    return input;
};

// Note: This function makes some heavy assumptions on the hostname. Only intended to work on proton-domains.
export const getSecondLevelDomain = (hostname: string) => {
    return hostname.slice(hostname.indexOf('.') + 1);
};

export const getRelativeApiHostname = (hostname: string) => {
    const idx = hostname.indexOf('.');
    const first = hostname.slice(0, idx);
    const second = hostname.slice(idx + 1);
    return `${first}-api.${second}`;
};

export const getIsDohDomain = (origin: string) => {
    return DOH_DOMAINS.some((dohDomain) => origin.endsWith(dohDomain));
};

const doesHostnameLookLikeIP = (hostname: string) => {
    // Quick helper function to tells us if hostname string seems to be IP address or DNS name.
    // Relies on a fact, that no TLD ever will probably end with a digit. So if last char is
    // a digit, it's probably an IP.
    // IPv6 addresses can end with a letter, so there's additional colon check also.
    // Probably no need ever to use slow & complicated IP regexes here, but feel free to change
    // whenever we have such util functions available.
    // Note: only works on hostnames (no port), not origins (can include port and protocol).
    return /\d$/.test(hostname) || hostname.includes(':');
};

export const getApiSubdomainUrl = (pathname: string, origin: string) => {
    const url = new URL('', origin);

    const usePathPrefix =
        url.hostname === 'localhost' || getIsDohDomain(url.origin) || doesHostnameLookLikeIP(url.hostname);
    if (usePathPrefix) {
        url.pathname = `/api${pathname}`;
        return url;
    }

    url.hostname = getRelativeApiHostname(url.hostname);
    url.pathname = pathname;
    return url;
};

export const getAppUrlFromApiUrl = (apiUrl: string, appName: APP_NAMES) => {
    const { subdomain } = APPS_CONFIGURATION[appName];
    const url = new URL(apiUrl);
    const { hostname } = url;
    const index = hostname.indexOf('.');
    const tail = hostname.slice(index + 1);
    url.pathname = '';
    url.hostname = `${subdomain}.${tail}`;
    return url;
};

export const getAppUrlRelativeToOrigin = (origin: string, appName: APP_NAMES) => {
    const { subdomain } = APPS_CONFIGURATION[appName];
    const url = new URL(origin);
    const segments = url.host.split('.');
    segments[0] = subdomain;
    url.hostname = segments.join('.');
    return url;
};

let cache = '';
export const getStaticURL = (path: string, location = window.location) => {
    if (
        location.hostname === 'localhost' ||
        getIsDohDomain(location.origin) ||
        SUPPORTED_PROTOCOLS.includes(location.protocol)
    ) {
        return `https://proton.me${path}`;
    }

    // We create a relative URL to support the TOR domain
    cache = cache || getSecondLevelDomain(location.hostname);
    // The VPN domain has a different static site and the proton.me urls are not supported there
    const hostname = cache === 'protonvpn.com' || cache === 'protonmail.com' ? 'proton.me' : cache;
    return `https://${hostname}${path}`;
};

export const getBlogURL = (path: string) => {
    return getStaticURL(`/blog${path}`);
};

export const getKnowledgeBaseUrl = (path: string) => {
    return getStaticURL(`/support${path}`);
};

export const getDomainsSupportURL = () => {
    return getStaticURL('/support/mail/custom-email-domain');
};

export const getBridgeURL = () => {
    return getStaticURL('/mail/bridge');
};

export const getEasySwitchURL = () => {
    return getStaticURL('/easyswitch');
};

export const getImportExportAppUrl = () => {
    return getStaticURL('/support/proton-mail-export-tool');
};

export const getShopURL = () => {
    return `https://shop.proton.me`;
};

export const getDownloadUrl = (path: string) => {
    return `https://proton.me/download${path}`;
};

export const getSupportContactURL = (params: { [key: string]: string | string[] | undefined }) => {
    return getStaticURL(`/support/contact${stringifySearchParams(params, '?')}`);
};

export const getAppStaticUrl = (app: APP_NAMES) => {
    if (app === 'proton-mail') {
        return getStaticURL('/mail');
    }

    if (app === 'proton-drive') {
        return getStaticURL('/drive');
    }

    if (app === 'proton-calendar') {
        return getStaticURL('/calendar');
    }

    if (app === 'proton-pass') {
        return getStaticURL('/pass');
    }

    if (app === 'proton-vpn-settings') {
        return getStaticURL('/vpn');
    }

    if (app === 'proton-wallet') {
        return getStaticURL('/wallet');
    }

    return getStaticURL('');
};

export const getPrivacyPolicyURL = (app?: APP_NAMES) => {
    if (app === APPS.PROTONVPN_SETTINGS) {
        return 'https://protonvpn.com/privacy-policy';
    }
    return getStaticURL('/legal/privacy');
};

export const getTermsURL = (app: APP_NAMES, locale?: string) => {
    if (app === APPS.PROTONWALLET) {
        return getStaticURL('/legal/wallet/terms');
    }
    const link = locale && locale !== 'en' ? `/${locale}/legal/terms` : '/legal/terms';
    return getStaticURL(link);
};

export const getBlackFriday2023URL = (app?: APP_NAMES) => {
    if (app === APPS.PROTONVPN_SETTINGS) {
        return 'https://protonvpn.com/support/black-friday-2023';
    }
    return getKnowledgeBaseUrl('/black-friday-2023');
};

export const getAbuseURL = () => {
    return getStaticURL('/support/abuse');
};

export const isValidHttpUrl = (string: string) => {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.protocol === 'http:' || url.protocol === 'https:';
};

export const isAppFromURL = (url: string | undefined, app: APP_NAMES) => {
    if (url) {
        const { host } = new URL(url);
        const segments = host.split('.');
        return segments[0] === APPS_CONFIGURATION[app].subdomain;
    }
    return false;
};

const defaultUrlParameters = { load: 'ajax' };

export const formatURLForAjaxRequest = (
    href: string,
    urlParameters: Record<string, string> = defaultUrlParameters
): URL => {
    // Create a new URL object from the href
    const url = new URL(href);

    // Merge existing search parameters with additional urlParameters
    const searchParams = new URLSearchParams(url.search);
    Object.entries(urlParameters).forEach(([key, value]) => {
        searchParams.set(key, value);
    });

    // Set the merged search parameters back to the URL
    url.search = searchParams.toString();

    // Remove the hash fragment
    url.hash = '';

    return url;
};

export const getPathFromLocation = (location: { pathname: string; hash: string; search: string }) => {
    return [location.pathname, location.search, location.hash].join('');
};

export const joinPaths = (...paths: string[]) => {
    return paths.reduce((acc, path) => {
        return `${stripTrailingSlash(acc)}/${stripLeadingSlash(path)}`;
    }, '');
};

export const getVpnAccountUrl = (location = window.location) => {
    if (location.hostname === VPN_HOSTNAME) {
        return `https://${VPN_HOSTNAME}`;
    }
    const secondLevelDomain = getSecondLevelDomain(location.hostname);
    return `https://vpn.${secondLevelDomain}`;
};
