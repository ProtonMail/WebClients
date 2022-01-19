import { Recipient } from '@proton/shared/lib/interfaces';
import { protonizer, sanitizeString } from '@proton/shared/lib/sanitize';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { unescapeFromString } from '@proton/shared/lib/sanitize/escape';

import { MAILTO_PROTOCOL_HANDLER_PATH } from '../constants';
import { PartialMessageState } from '../logic/messages/messagesTypes';

/**
 * Split an addresses string to a list of recipients
 * @param emailsStr
 */
export const toAddresses = (emailsStr: string): Recipient[] => {
    const emails = sanitizeString(emailsStr).split(',');

    // Remove potential unwanted HTML entities such as '&shy;' from the address
    const escaped = emails.map((email) => {
        // Some HTML Entities might still be URI encoded at this point
        const uriDecoded = decodeURIComponent(email);
        return unescapeFromString(uriDecoded);
    });

    return escaped.map((Address) => ({ Address, Name: Address }));
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

    const to = sanitizeString(mailto.substring(7, j));

    const url = new URL(mailto);

    const searchObject = {
        subject: url.searchParams.get('subject'),
        cc: url.searchParams.get('cc'),
        bcc: url.searchParams.get('bcc'),
        body: url.searchParams.get('body'),
    };

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
        // use protonizer to replace src attributes to proton-src so that images are not loading without user approval
        decryptedBody = decodeURIComponent(protonizer(searchObject.body, true).innerHTML);
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
