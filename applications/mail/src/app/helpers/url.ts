import { Location } from 'history';
import { parseURL } from 'proton-shared/lib/helpers/browser';

import { LINK_TYPES } from '../constants';
import { input, message as purifyMessage } from './purify';
import { Recipient } from '../models/address';
import { Message, PartialMessageExtended } from '../models/message';

const PREFIX_TO_TYPE: { [prefix: string]: LINK_TYPES | undefined } = {
    'tel:': LINK_TYPES.PHONE,
    'mailto:': LINK_TYPES.EMAIL,
    'http://': LINK_TYPES.WEB,
    'https://': LINK_TYPES.WEB
};

const TYPE_TO_PREFIX = {
    [LINK_TYPES.PHONE]: { regex: /^tel:/, defaultPrefix: 'tel:' },
    [LINK_TYPES.EMAIL]: { regex: /^mailto:/, defaultPrefix: 'mailto:' },
    [LINK_TYPES.WEB]: { regex: /^http(|s):\/\//, defaultPrefix: 'https://' }
};

// Create one big regexp of all the regexes in TYPE_TO_PREFIX.
// It can be used for finding a particular type from a link.
const ALL_REGEXP_SOURCES = (Object.keys(TYPE_TO_PREFIX) as LINK_TYPES[])
    .map((key) => `(${TYPE_TO_PREFIX[key].regex.source})`)
    .join('|');

const ALL_REGEXP = new RegExp(ALL_REGEXP_SOURCES);

export const getSearchParams = (location: Location): { [key: string]: string } => {
    const params = new URLSearchParams(location.search);

    const result: { [key: string]: string } = {};

    params.forEach((value, key) => {
        result[key] = value;
    });

    return result;
};

export const changeSearchParams = (location: Location, newParams: { [key: string]: string | undefined }) => {
    const params = new URLSearchParams(location.search);

    for (const key in newParams) {
        if (newParams[key] === undefined) {
            params.delete(key);
        } else {
            params.set(key, newParams[key] as string);
        }
    }

    const queryString = params.toString();
    const urlFragment = (queryString === '' ? '' : '?') + queryString;

    return location.pathname + urlFragment;
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

export const isSubDomain = (hostname: string, domain: string) => {
    if (hostname === domain) {
        return true;
    }

    return hostname.endsWith(`.${domain}`);
};

export const getHostname = (url: string) => {
    if (/^https?:\/\//.test(url)) {
        // Absolute URL.
        // The easy way to parse an URL, is to create <a> element.
        // @see: https://gist.github.com/jlong/2428561
        const parser = document.createElement('a');
        parser.href = url;
        return parser.hostname;
    }
    return window.location.hostname; // Relative URL.
};

export const isExternal = (url: string) => {
    try {
        return window.location.hostname !== getHostname(url);
    } catch (e) {
        /*
         * IE11/Edge are the worst, they crash when they try to parse
         * ex: http://xn--rotonmail-4sg.com
         * so if it does we know it's an external link (⌐■_■)
         */
        return true;
    }
};

/**
 * Split an addresses string to a list of recipients
 * @param emailsStr
 */
export const toAddresses = (emailsStr: string): Recipient[] => {
    const emails = input(emailsStr).split(',');
    return emails.map((Address) => ({ Address, Name: Address }));
};

/**
 * Parse a mailto string
 * @param Mailto string to parse
 * @return Partial message formated from mailto string
 */
export const mailtoParser = (mailto: string): PartialMessageExtended => {
    if (mailto.toLowerCase().indexOf('mailto:') !== 0) {
        return {};
    }

    let j = mailto.indexOf('?');

    // If no `?` detected
    if (j < 0) {
        j = mailto.length;
    }

    const to = input(mailto.substring(7, j));
    const { searchObject = {} as any } = parseURL(mailto.replace(/&amp;/g, '&'));
    const message: Partial<Message> = {};
    let decryptedBody;

    if (to) {
        message.ToList = toAddresses(to);
    }

    if (searchObject.subject) {
        message.Subject = decodeURIComponent(input(searchObject.subject));
    }

    if (searchObject.cc) {
        message.CCList = toAddresses(searchObject.cc);
    }

    if (searchObject.bcc) {
        message.BCCList = toAddresses(searchObject.bcc);
    }

    if (searchObject.body) {
        decryptedBody = decodeURIComponent(purifyMessage(searchObject.body));
    }

    return { data: message, decryptedBody };
};
