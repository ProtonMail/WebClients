/**
 * Validate the local part of an email string according to the RFC https://tools.ietf.org/html/rfc5321#section-4.1.2;
 * see also https://tools.ietf.org/html/rfc3696#page-5 and https://en.wikipedia.org/wiki/Email_address#Local-part
 *
 * NOTE: Email providers respect the RFC only loosely. We do not want to invalidate addresses that would be accepted by the BE.
 * It is not fully guaranteed that this helper is currently accepting everything that the BE accepts.
 *
 * Examples of RFC rules violated in the wild:
 * * Local parts should have a maximum length of 64 octets
 */
import isTruthy from './isTruthy';
import { MAJOR_DOMAINS } from '../constants';
import { Recipient } from '../interfaces';

export const validateLocalPart = (localPart: string) => {
    // remove comments first
    const match = localPart.match(/(^\(.+?\))?([^()]*)(\(.+?\)$)?/);
    if (!match) {
        return false;
    }
    const uncommentedPart = match[2];
    if (/^".+"$/.test(uncommentedPart)) {
        // case of a quoted string
        // The only characters non-allowed are \ and " unless preceded by a backslash
        const quotedText = uncommentedPart.slice(1, -1);
        const chunks = quotedText
            .split('\\"')
            .map((chunk) => chunk.split('\\\\'))
            .flat();
        return !chunks.some((chunk) => /"|\\/.test(chunk));
    }
    return !/[^a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]|^\.|\.$|\.\./.test(uncommentedPart);
};

/**
 * Validate the domain of an email string according to the preferred name syntax of the RFC https://tools.ietf.org/html/rfc1034.
 * Actually almost anything is allowed as domain name https://tools.ietf.org/html/rfc2181#section-11, but we stick
 * to the preferred one, allowing undescores which are common in the wild.
 * See also https://en.wikipedia.org/wiki/Email_address#Domain
 */
export const validateDomain = (domain: string) => {
    if (domain.length > 255) {
        return false;
    }
    if (/\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\]/.test(domain)) {
        return true;
    }
    const dnsLabels = domain.toLowerCase().split('.').filter(isTruthy);
    if (dnsLabels.length < 2) {
        return false;
    }
    const topLevelDomain = dnsLabels.pop() as string;
    if (!/[a-z]{2,}/.test(topLevelDomain)) {
        return false;
    }
    return !dnsLabels.some((label) => {
        return /[^a-z0-9-_]|^-|-$/.test(label);
    });
};

/**
 * Split an email into local part plus domain.
 */
export const getEmailParts = (email: string): string[] => {
    const endIdx = email.lastIndexOf('@');
    if (endIdx === -1) {
        return [email];
    }
    return [email.slice(0, endIdx), email.slice(endIdx + 1)];
};

/**
 * Validate an email string according to the RFC https://tools.ietf.org/html/rfc5322;
 * see also https://en.wikipedia.org/wiki/Email_address
 */
export const validateEmailAddress = (email: string) => {
    const [localPart, domain] = getEmailParts(email);
    if (!localPart || !domain) {
        return false;
    }
    return validateLocalPart(localPart) && validateDomain(domain);
};

/**
 * Normalize an internal email. This is needed to compare when two internal emails should be considered equivalent
 * See documentation at https://confluence.protontech.ch/display/MAILFE/Email+normalization
 */
export const normalizeInternalEmail = (email: string) => {
    const [localPart, domain] = getEmailParts(email);
    if (!domain) {
        return email.replace(/[._-]/g, '').toLowerCase();
    }
    const normalizedLocalPart = localPart.replace(/[._-]/g, '').toLowerCase();
    const normalizedDomain = domain.toLocaleLowerCase();
    return `${normalizedLocalPart}@${normalizedDomain}`;
};

/**
 * Normalize an external email. This is needed to compare when two external emails should be considered equivalent.
 * Ideally we should have a set of normalization rules per provider. Until we have that, we simply lower case the
 * email address, as most providers are case-insensitive
 * See documentation at https://confluence.protontech.ch/display/MAILFE/Email+normalization for more information
 */
export const normalizeExternalEmail = (email: string) => {
    return email.toLowerCase().trim();
};

/**
 * Normalize an email. This is needed to compare when two emails should be considered equivalent
 * See documentation at https://confluence.protontech.ch/display/MAILFE/Email+normalization
 */
export const normalizeEmail = (email: string, isInternal?: boolean) => {
    return isInternal ? normalizeInternalEmail(email) : normalizeExternalEmail(email);
};

const extractStringItems = (str: string) => {
    return str.split(',').filter(isTruthy);
};

/**
 * Try to decode an URI string with the native decodeURI function.
 * Return the original string if decoding fails
 */
const decodeURISafe = (str: string) => {
    try {
        return decodeURI(str);
    } catch (e) {
        return str;
    }
};

/**
 * Extract "to address" and headers from a mailto URL https://tools.ietf.org/html/rfc6068
 */
export const parseMailtoURL = (mailtoURL: string, decode = true) => {
    const mailtoString = 'mailto:';
    const toString = 'to=';
    if (!mailtoURL.toLowerCase().startsWith(mailtoString)) {
        throw new Error('Malformed mailto URL');
    }
    const url = mailtoURL.substring(mailtoString.length);
    const [tos, hfields = ''] = url.split('?');
    const addressTos = extractStringItems(tos).map((to) => (decode ? decodeURISafe(to) : to));
    const headers = hfields.split('&').filter(isTruthy);
    const headerTos = headers
        .filter((header) => header.toLowerCase().startsWith('to='))
        .map((headerTo) => extractStringItems(headerTo.substring(toString.length)))
        .flat()
        .map((to) => (decode ? decodeURISafe(to) : to));
    return { to: [...addressTos, ...headerTos] };
};

export const buildMailTo = (email = '') => `mailto:${email}`;

export const getEmailTo = (str: string, decode?: boolean): string => {
    try {
        const {
            to: [emailTo],
        } = parseMailtoURL(str, decode);
        return emailTo;
    } catch (e) {
        return str;
    }
};

/**
 * Remove plus alias part present in the email value
 */
export const removeEmailAlias = (email = '', isInternal?: boolean) => {
    return normalizeEmail(email, isInternal).replace(/(\+[^@]*)@/, '@');
};

/**
 * Add plus alias part for an email
 */
export const addPlusAlias = (email = '', plus = '') => {
    const atIndex = email.indexOf('@');
    const plusIndex = email.indexOf('+');

    if (atIndex === -1 || plusIndex > -1) {
        return email;
    }

    const name = email.substring(0, atIndex);
    const domain = email.substring(atIndex, email.length);

    return `${name}+${plus}${domain}`;
};

export const majorDomainsMatcher = (inputValue: string) => {
    const [localPart, domainPart] = getEmailParts(inputValue);
    if (!localPart || typeof domainPart !== 'string') {
        return [];
    }
    return MAJOR_DOMAINS.map((domain) => {
        const email = `${localPart}@${domain}`;
        return { Address: email, Name: email } as Recipient;
    });
};
