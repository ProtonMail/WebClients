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
import isTruthy from '@proton/utils/isTruthy';

export enum CANONICALIZE_SCHEME {
    DEFAULT,
    PLUS,
    GMAIL,
    PROTON,
}

export const PROTONMAIL_DOMAINS = ['protonmail.com', 'protonmail.ch', 'pm.me', 'proton.me'];

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
    const domainRegex =
        /^((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+([a-zA-Z]{2,}[0-9]*|xn--[a-zA-Z\-0-9]+)))$/;
    if (domainRegex.test(domain)) {
        return true;
    }
    const dnsLabels = domain.toLowerCase().split('.').filter(isTruthy);
    if (dnsLabels.length < 2) {
        return false;
    }
    const topLevelDomain = dnsLabels.pop() as string;
    if (!/^[a-z0-9]+$/.test(topLevelDomain)) {
        return false;
    }
    return !dnsLabels.some((label) => {
        return /[^a-z0-9-_]|^-|-$/.test(label);
    });
};

/**
 * Split an email into local part plus domain.
 */
export const getEmailParts = (email: string): [localPart: string, domain: string] => {
    const endIdx = email.lastIndexOf('@');
    if (endIdx === -1) {
        return [email, ''];
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

export const removePlusAliasLocalPart = (localPart = '') => {
    const [cleanLocalPart] = localPart.split('+');
    return cleanLocalPart;
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

/**
 * Canonicalize an email address following one of the known schemes
 * Emails that have the same canonical form end up in the same inbox
 * See https://confluence.protontech.ch/display/MBE/Canonize+email+addresses
 */
export const canonicalizeEmail = (email: string, scheme = CANONICALIZE_SCHEME.DEFAULT) => {
    const [localPart, domain] = getEmailParts(email);
    const at = email[email.length - domain.length - 1] === '@' ? '@' : '';
    if (scheme === CANONICALIZE_SCHEME.PROTON) {
        const cleanLocalPart = removePlusAliasLocalPart(localPart);
        const normalizedLocalPart = cleanLocalPart.replace(/[._-]/g, '').toLowerCase();
        const normalizedDomain = domain.toLowerCase();

        return `${normalizedLocalPart}${at}${normalizedDomain}`;
    }
    if (scheme === CANONICALIZE_SCHEME.GMAIL) {
        const cleanLocalPart = removePlusAliasLocalPart(localPart);
        const normalizedLocalPart = cleanLocalPart.replace(/[.]/g, '').toLowerCase();
        const normalizedDomain = domain.toLowerCase();

        return `${normalizedLocalPart}${at}${normalizedDomain}`;
    }
    if (scheme === CANONICALIZE_SCHEME.PLUS) {
        const cleanLocalPart = removePlusAliasLocalPart(localPart);
        const normalizedLocalPart = cleanLocalPart.toLowerCase();
        const normalizedDomain = domain.toLowerCase();

        return `${normalizedLocalPart}${at}${normalizedDomain}`;
    }

    return email.toLowerCase();
};

export const canonicalizeInternalEmail = (email: string) => canonicalizeEmail(email, CANONICALIZE_SCHEME.PROTON);

/**
 * Canonicalize an email by guessing the scheme that should be applied
 * Notice that this helper will not apply the Proton scheme on custom domains;
 * Only the back-end knows about custom domains, but they also apply the default scheme in those cases.
 */
export const canonicalizeEmailByGuess = (email: string) => {
    const [, domain] = getEmailParts(email);
    const normalizedDomain = domain.toLowerCase();
    if (PROTONMAIL_DOMAINS.includes(normalizedDomain)) {
        return canonicalizeEmail(email, CANONICALIZE_SCHEME.PROTON);
    }
    if (['gmail.com', 'googlemail.com', 'google.com'].includes(normalizedDomain)) {
        return canonicalizeEmail(email, CANONICALIZE_SCHEME.GMAIL);
    }
    if (
        ['hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'outlook.com', 'yandex.ru', 'mail.ru'].includes(normalizedDomain)
    ) {
        return canonicalizeEmail(email, CANONICALIZE_SCHEME.PLUS);
    }
    return canonicalizeEmail(email, CANONICALIZE_SCHEME.DEFAULT);
};

const extractStringItems = (str: string) => {
    // filter(isTruthy) wouldn't result in TS understanding that the return of this function is of type string[], so we expand it
    return str.split(',').filter((item) => isTruthy(item));
};

/**
 * Try to decode an URI string with the native decodeURI function.
 * Return the original string if decoding fails
 */
const decodeURISafe = (str: string) => {
    try {
        return decodeURI(str);
    } catch (e: any) {
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

export const getEmailTo = (str: string, decode?: boolean) => {
    try {
        const {
            to: [emailTo = ''],
        } = parseMailtoURL(str, decode);
        return emailTo;
    } catch (e: any) {
        return str;
    }
};

export function extractEmailFromUserID(userID: string): string | undefined {
    const [, email] = /<([^>]*)>/.exec(userID) || [];
    return email;
}

export const isNoReplyEmail = (email: string) => {
    const normalizedEmail = canonicalizeEmailByGuess(email);
    const [localPart] = getEmailParts(normalizedEmail);
    return localPart.includes('noreply') || localPart.includes('no-reply') || localPart.includes('donotreply');
};
