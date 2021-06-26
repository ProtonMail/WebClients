import { Recipient } from 'proton-shared/lib/interfaces';
import { message as purifyMessage, sanitizeString } from 'proton-shared/lib/sanitize';
import { parseURL } from 'proton-shared/lib/helpers/browser';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { PartialMessageExtended } from '../models/message';

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
