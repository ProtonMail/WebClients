import { APPS_CONFIGURATION, APP_NAMES, LINK_TYPES } from '../constants';

const PREFIX_TO_TYPE: { [prefix: string]: LINK_TYPES | undefined } = {
    'tel:': LINK_TYPES.PHONE,
    'mailto:': LINK_TYPES.EMAIL,
    'http://': LINK_TYPES.WEB,
    'https://': LINK_TYPES.WEB,
};

const TYPE_TO_PREFIX = {
    [LINK_TYPES.PHONE]: { regex: /^tel:/, defaultPrefix: 'tel:' },
    [LINK_TYPES.EMAIL]: { regex: /^mailto:/, defaultPrefix: 'mailto:' },
    [LINK_TYPES.WEB]: { regex: /^http(|s):\/\//, defaultPrefix: 'https://' },
};

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

export const stringifySearchParams = (params: { [key: string]: string | string[] | undefined }) => {
    const urlSearchParams = new URLSearchParams();

    Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .forEach(([key, value]) => {
            /*
             * typescript is not able to determine that stringifiedValue
             * can't be undefined because of the previous filter condition
             * therefore, typecast to string
             */
            const stringifiedValue = Array.isArray(value) ? value.join(',') : (value as string);

            urlSearchParams.set(key, stringifiedValue);
        });

    return urlSearchParams.toString();
};

/**
 * Return a param (native) map based on the search string
 */
export const getSearchParams = (search: string): { [key: string]: string } => {
    const params = new URLSearchParams(getSearchFromHash(search));

    const result: { [key: string]: string } = {};

    params.forEach((value, key) => {
        result[key] = value;
    });

    return result;
};

/**
 * Return a new pathname with the query string updated from
 * the search input and updated with the newParams
 */
export const changeSearchParams = (
    pathname: string,
    search: string,
    newParams: { [key: string]: string | undefined }
) => {
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
    return hostname.substr(hostname.indexOf('.') + 1);
};

export const getRelativeApiHostname = (hostname: string) => {
    const idx = hostname.indexOf('.');
    const first = hostname.substr(0, idx);
    const second = hostname.substr(idx + 1);
    return `${first}-api.${second}`;
};

export const getApiSubdomainUrl = (pathname: string) => {
    const url = new URL('/', window.location.origin);
    if (url.hostname === 'localhost') {
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
    const tail = hostname.substr(index + 1);
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
