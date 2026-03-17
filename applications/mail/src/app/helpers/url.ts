import type { PartialMessageState } from '@proton/mail/store/messages/messagesTypes';
import { unescapeFromString } from '@proton/sanitize/escape';
import { protonizer, sanitizeString } from '@proton/sanitize/purify';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { MAILTO_PROTOCOL_HANDLER_PATH } from '../constants';

/**
 * Split an addresses string to a list of recipients
 * @param emailsStr
 */
export const toAddresses = (emailsStr: string): Recipient[] => {
    const emails = emailsStr.split(',');

    // Remove potential unwanted HTML entities such as '&shy;' from the address
    const escaped = emails.map((email) => {
        return unescapeFromString(email).trim();
    });

    return escaped.map((element) => {
        // Search for elements with format "Name <Address>"
        const nameAndAddressRegex = /([^<>]*)<(.*)>/g;
        const findNameAndAddress = nameAndAddressRegex.exec(element);

        // The first value of regex.exec is the entire match, but we want groups results
        if (findNameAndAddress && findNameAndAddress.length === 3) {
            return {
                Name: sanitizeString(findNameAndAddress[1]).trim(),
                Address: sanitizeString(findNameAndAddress[2]).trim(),
            };
        }

        const sanitizedElement = sanitizeString(element).trim();
        // Element is an address only
        return { Name: sanitizedElement, Address: sanitizedElement };
    });
};

const MAILTO_PARAMS = {
    subject: null,
    cc: null,
    bcc: null,
    body: null,
} as const;

type MailtoParams = Record<keyof typeof MAILTO_PARAMS, string | null>;

const isMailtoParam = (key: string): key is keyof MailtoParams => {
    return key in MAILTO_PARAMS;
};

/**
 * NOTE: Unlike URL.searchParams.get(), this does not treat `+` as space, important for email aliases (user+tag@proton.me)
 *
 * Some mailto links in the wild may use `+` for spaces instead of %20, though they should be rare.
 *
 * This is compliant with RFC 6068 (MAILTO)
 *
 * @param search - mailto query string excluding the to section
 */
const parseMailtoParams = (search: string): MailtoParams => {
    const params: MailtoParams = { subject: null, cc: null, bcc: null, body: null };
    if (!search || search === '?') {
        return params;
    }

    const query = search.startsWith('?') ? search.slice(1) : search;
    for (const pair of query.split('&')) {
        const eqIndex = pair.indexOf('=');
        if (eqIndex === -1) {
            continue;
        }
        const key = decodeURIComponent(pair.slice(0, eqIndex)).toLowerCase();
        if (isMailtoParam(key)) {
            params[key] = decodeURIComponent(pair.slice(eqIndex + 1));
        }
    }

    return params;
};

/**
 * Parse a mailto string
 * @param Mailto string to parse
 * @return Partial message formated from mailto string
 */
export const mailtoParser = (mailto: string): PartialMessageState => {
    if (mailto.toLowerCase().indexOf('mailto:') !== 0) {
        return {};
    }

    let j = mailto.indexOf('?');

    // If no `?` detected
    if (j < 0) {
        j = mailto.length;
    }

    const to = mailto.substring(7, j);

    const url = new URL(mailto);
    const searchObject = parseMailtoParams(url.search);

    const message: Partial<Message> = {};
    let decryptedBody;

    if (to) {
        message.ToList = toAddresses(decodeURIComponent(to));
    }

    if (searchObject.subject) {
        message.Subject = sanitizeString(searchObject.subject);
    }

    if (searchObject.cc) {
        message.CCList = toAddresses(searchObject.cc);
    }

    if (searchObject.bcc) {
        message.BCCList = toAddresses(searchObject.bcc);
    }

    if (searchObject.body) {
        // Convert newline characters to <br> tags so they pass through HTML processing.
        // Handles %0D%0A (CRLF) and %0A (LF) after URL decoding.
        const bodyWithLineBreaks = searchObject.body.replace(/\r\n|\n/g, '<br />');
        // use protonizer to replace src attributes to proton-src so that images are not loading without user approval
        decryptedBody = protonizer(bodyWithLineBreaks, true).innerHTML;
    }

    return { data: message, decryption: { decryptedBody } };
};

export const registerMailToProtocolHandler = () => {
    if ('registerProtocolHandler' in navigator) {
        try {
            navigator.registerProtocolHandler(
                'mailto',
                `${window.location.origin}${MAILTO_PROTOCOL_HANDLER_PATH}`,
                // @ts-expect-error third arg is still recommended (cf. https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler)
                'ProtonMail'
            );
        } catch (e: any) {
            console.error(e);
        }
    }
};
