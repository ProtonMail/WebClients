import { c } from 'ttag';

import { escape } from '@proton/sanitize/escape';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import type { Address, Recipient } from '@proton/shared/lib/interfaces/Address';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { FORWARDED_MESSAGE, isPlainText } from '@proton/shared/lib/mail/messages';

import { MESSAGE_ACTIONS } from '../../../constants';
import type { PartialMessageState } from '../../../store/messages/messagesTypes';
import { formatFullDate } from '../../date';
import { plainTextToHTML } from '../messageContentConversion';
import { getDocumentContent } from '../messageContentQuery';
import { CLASSNAME_BLOCKQUOTE } from '../messageDraftConstants';
import { formatRecipientsString } from '../messageDraftFormat';
import { restoreImages } from '../messageImages';
import { insertSignature } from '../messageSignature';

export const generatePreviousMessageInfos = (referenceMessage: PartialMessageState, action: MESSAGE_ACTIONS) => {
    /**
     * Warning, if this logic is being updated, the plaintext blockquote detection needs to be updated as well.
     * See "locatePlaintextInternalBlockquotes" function
     */
    const senderString = formatRecipientsString([referenceMessage.data?.Sender] as Recipient[], 'html');
    const time = referenceMessage.data ? new Date((referenceMessage.data.Time || 0) * 1000) : new Date();
    const date = escape(formatFullDate(time));

    if (action === MESSAGE_ACTIONS.FORWARD) {
        const ccString = formatRecipientsString(referenceMessage.data?.CCList as Recipient[], 'html');
        const toString = formatRecipientsString(referenceMessage.data?.ToList as Recipient[], 'html');
        const ccRecipients = (referenceMessage.data?.CCList?.length || 0) > 0 ? `CC: ${ccString}<br>` : '';
        const subject = escape(referenceMessage.data?.Subject ?? '');

        /*
         * translator: String inserted in draft blockquotes when forwarding a message
         * ${senderString} is a string containing the sender of the message you're forwarding
         * Full sentence for reference: "From: Display Name <address@protonmail.com>"
         */
        const fromString = c('forwardmessage').t`From: ${senderString}`;
        /*
         * translator: String inserted in draft blockquotes when forwarding a message
         * ${date} is the localized date "Thursday, October 27th, 2022 at 12:31", for example
         * Full sentence for reference: "Date: On Thursday, October 27th, 2022 at 12:31"
         */
        const dateString = c('forwardmessage').t`Date: On ${date}`;
        /*
         * translator: String inserted in draft blockquotes when forwarding a message
         * ${subject} is a string containing the subject of the message you're forwarding
         */
        const subjectString = c('forwardmessage').t`Subject: ${subject}`;
        /*
         * translator: String inserted in draft blockquotes when forwarding a message
         * ${toString} is a string containing the recipients of the message you're forwarding
         * Full sentence for reference: "To: Display Name <address@protonmail.com>"
         */
        const recipientString = c('forwardmessage').t`To: ${toString}`;

        return `${FORWARDED_MESSAGE}<br>
        ${fromString}<br>
        ${dateString}<br>
        ${subjectString}<br>
        ${recipientString}<br>
        ${ccRecipients}<br>`;
    } else {
        /*
         * translator: String inserted in draft blockquotes when replying to a message
         * ${date} is the localized date "Thursday, October 27th, 2022 at 12:31", for example
         * ${senderString} is a string containing the sender of the message you're replying to
         * Full sentence for reference: "On Thursday, October 27th, 2022 at 12:31, Display Name <address@protonmail.com> wrote:"
         */
        const previously = c('Message').t`On ${date}, ${senderString} wrote:`;

        return `${previously}<br>`;
    }
};

/**
 * Generate blockquote of the referenced message to the content of the new mail
 */
export const generateBlockquote = (
    referenceMessage: PartialMessageState,
    mailSettings: MailSettings,
    userSettings: UserSettings,
    addresses: Address[],
    action: MESSAGE_ACTIONS
) => {
    let previousContent: string | undefined;
    if (referenceMessage.errors?.decryption) {
        previousContent = referenceMessage.data?.Body;
    } else if (isPlainText(referenceMessage.data)) {
        previousContent = plainTextToHTML(
            referenceMessage.data as Message,
            referenceMessage.decryption?.decryptedBody,
            mailSettings,
            userSettings,
            addresses
        );
    } else {
        previousContent = getDocumentContent(
            restoreImages(referenceMessage.messageDocument?.document, referenceMessage.messageImages)
        );
    }

    const previousMessageInfos = generatePreviousMessageInfos(referenceMessage, action);

    return `<div class="${CLASSNAME_BLOCKQUOTE}"><br>
        ${previousMessageInfos}
        <blockquote class="${CLASSNAME_BLOCKQUOTE}" type="cite">
            ${previousContent}
        </blockquote><br>
    </div>`;
};

export const createHTMLDraftContent = ({
    action,
    referenceMessage,
    mailSettings,
    userSettings,
    addresses,
    senderAddress,
    fontStyle,
}: {
    action: MESSAGE_ACTIONS;
    referenceMessage?: PartialMessageState;
    mailSettings: MailSettings;
    userSettings: UserSettings;
    addresses: Address[];
    senderAddress?: { Signature: string };
    fontStyle: string;
}) => {
    const messageBody =
        action === MESSAGE_ACTIONS.NEW
            ? referenceMessage?.decryption?.decryptedBody || ''
            : generateBlockquote(referenceMessage || {}, mailSettings, userSettings, addresses, action);

    let messageWithSignature: string;
    if (action === MESSAGE_ACTIONS.NEW && messageBody) {
        // For mailto bodies, place it first then the signature after.
        const signatureOnly = insertSignature('', senderAddress?.Signature, mailSettings, userSettings, fontStyle);
        messageWithSignature = messageBody + signatureOnly;
    } else {
        messageWithSignature = insertSignature(
            messageBody,
            senderAddress?.Signature,
            mailSettings,
            userSettings,
            fontStyle
        );
    }

    return { plainText: undefined, document: parseStringToDOM(messageWithSignature).body };
};
