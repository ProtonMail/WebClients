import { c } from 'ttag';

import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import type { PartialMessageState } from '@proton/mail/store/messages/messagesTypes';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import type { Recipient } from '@proton/shared/lib/interfaces/Address';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { FORWARDED_MESSAGE, isPlainText } from '@proton/shared/lib/mail/messages';

import { formatRecipientsString } from 'proton-mail/helpers/message/messageDraft';

import { formatFullDate } from '../../date';
import { getDate } from '../../elements';
import { exportPlainText, getDocumentContent } from '../messageContent';
import { restoreImages } from '../messageImages';
import { exportPlainTextSignature, templateBuilder } from '../messageSignature';

export const generatePlaintextPreviousMessageInfos = (
    referenceMessage: PartialMessageState,
    action: MESSAGE_ACTIONS
) => {
    const senderString = formatRecipientsString([referenceMessage.data?.Sender] as Recipient[], 'plaintext');
    const date = formatFullDate(getDate(referenceMessage?.data as Message, ''));

    if (action === MESSAGE_ACTIONS.FORWARD) {
        const ccString = formatRecipientsString(referenceMessage.data?.CCList as Recipient[], 'plaintext');
        const toString = formatRecipientsString(referenceMessage.data?.ToList as Recipient[], 'plaintext');
        const ccRecipients = (referenceMessage.data?.CCList?.length || 0) > 0 ? `CC: ${ccString}\n` : '';
        const subject = referenceMessage.data?.Subject;

        const fromString = c('forwardmessage').t`From: ${senderString}`;
        const dateString = c('forwardmessage').t`Date: On ${date}`;
        const subjectString = c('forwardmessage').t`Subject: ${subject}`;
        const recipientString = c('forwardmessage').t`To: ${toString}`;

        return `${FORWARDED_MESSAGE}\n${fromString}\n${dateString}\n${subjectString}\n${recipientString}\n${ccRecipients}`;
    } else {
        return c('Message').t`On ${date}, ${senderString} wrote:`;
    }
};

export const generatePlaintextBlockquote = (referenceMessage: PartialMessageState, action: MESSAGE_ACTIONS) => {
    let previousContent: string;

    if (referenceMessage.errors?.decryption) {
        // If there was a decryption error, use the encrypted body
        previousContent = referenceMessage.data?.Body || '';
    } else if (isPlainText(referenceMessage.data)) {
        // If plaintext, we can use the decrypted body directly
        previousContent = referenceMessage.decryption?.decryptedBody || '';
    } else {
        // If HTML, we need to convert it to plaintext
        const htmlContent = getDocumentContent(
            restoreImages(referenceMessage.messageDocument?.document, referenceMessage.messageImages)
        );
        previousContent = exportPlainText(htmlContent);
    }

    const previousMessageInfos = generatePlaintextPreviousMessageInfos(referenceMessage, action);

    // Each line of a plaintext blockquote starts with ">"
    const quotedContent = previousContent
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');

    return `${previousMessageInfos}\n\n${quotedContent}`;
};

export const createPlaintextDraftContent = ({
    action,
    referenceMessage,
    senderAddress,
    mailSettings,
    userSettings,
    fontStyle,
}: {
    action: MESSAGE_ACTIONS;
    referenceMessage?: PartialMessageState;
    senderAddress?: { Signature: string };
    mailSettings: MailSettings;
    userSettings: UserSettings;
    fontStyle: string;
}) => {
    const messageBody =
        action === MESSAGE_ACTIONS.NEW
            ? referenceMessage?.decryption?.decryptedBody || ''
            : generatePlaintextBlockquote(referenceMessage || {}, action);

    const signatureTemplate = templateBuilder(
        senderAddress?.Signature,
        mailSettings,
        userSettings,
        fontStyle,
        action !== MESSAGE_ACTIONS.NEW,
        true
    );
    const plaintextSignature = exportPlainTextSignature(signatureTemplate);

    // Plaintext drafts are starting with 4 empty lines
    const plainText = plaintextSignature ? `\n\n\n\n${plaintextSignature}\n\n${messageBody}` : `\n\n\n\n${messageBody}`;

    return { plainText, document: undefined };
};
