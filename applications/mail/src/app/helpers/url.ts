import { parseURL } from 'proton-shared/lib/helpers/browser';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { sanitizeString, message as purifyMessage } from 'proton-shared/lib/sanitize';
import { Recipient } from 'proton-shared/lib/interfaces/Address';

import { PartialMessageExtended } from '../models/message';

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
    const emails = sanitizeString(emailsStr).split(',');
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

    const to = sanitizeString(mailto.substring(7, j));
    const { searchObject = {} as any } = parseURL(mailto.replace(/&amp;/g, '&'));
    const message: Partial<Message> = {};
    let decryptedBody;

    if (to) {
        message.ToList = toAddresses(to);
    }

    if (searchObject.subject) {
        message.Subject = decodeURIComponent(sanitizeString(searchObject.subject));
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
