import { MIME_TYPES } from '@proton/shared/lib/constants';
import { Recipient } from '@proton/shared/lib/interfaces';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';

import { formatFullDate } from '../../../../helpers/date';
import { createDocument } from '../../../../helpers/test/message';
import { MessageDecryption } from '../../../../logic/messages/messagesTypes';
import { addressID, messageID, subject } from '../../../message/tests/Message.test.helpers';

export const fromFields = {
    fromAddress: 'from@protonmail.com',
    fromName: 'From',
    meAddress: 'me@protonmail.com',
    meName: 'Me',
    toAddress: 'to@protonmail.com',
    toName: 'To',
    ccAddress: 'cc@protonmail.com',
    ccName: 'CC',
    bccAddress: 'bcc@protonmail.com',
    bccName: 'BCC',
};

export const recipients: Record<string, Recipient> = {
    fromRecipient: { Name: fromFields.fromName, Address: fromFields.fromAddress },
    meRecipient: { Name: fromFields.meName, Address: fromFields.meAddress },
    toRecipient: { Name: fromFields.toName, Address: fromFields.toAddress },
    ccRecipient: { Name: fromFields.ccName, Address: fromFields.ccAddress },
    bccRecipient: { Name: fromFields.bccName, Address: fromFields.bccAddress },
};

export const data = {
    protonSignature: 'Sent with Proton Mail secure email.',
    defaultReferenceMessageBody: 'Reference Message Body',
    quickReplyRecipientsStart: 'Quick reply to',
    quickReplyMessageID: 'quick-reply-message-id',
};

export const getMessage = (isSender: boolean, isPlainText: boolean, referenceMessageBody: string) => ({
    localID: messageID,
    data: {
        ID: messageID,
        AddressID: addressID,
        Subject: subject,
        Sender: isSender ? recipients.meRecipient : recipients.fromRecipient,
        ReplyTos: isSender ? [recipients.meRecipient] : [recipients.fromRecipient],
        ToList: isSender
            ? [recipients.fromRecipient, recipients.toRecipient]
            : [recipients.meRecipient, recipients.toRecipient],
        CCList: [recipients.ccRecipient],
        BCCList: [recipients.bccRecipient],
        MIMEType: isPlainText ? MIME_TYPES.PLAINTEXT : MIME_TYPES.DEFAULT,
        Attachments: [] as Attachment[],
        Flags: isSender ? 2 : 1,
        Time: Date.now() / 1000,
    } as Message,

    decryption: {
        decryptedBody: isPlainText ? referenceMessageBody : createDocument(referenceMessageBody),
    } as MessageDecryption,
    messageDocument: {
        initialized: true,
        plainText: isPlainText ? referenceMessageBody : undefined,
        document: isPlainText ? undefined : createDocument(referenceMessageBody),
    },
});

export const getExpectedDefaultPlainTextContent = (referenceMessageBody: string) => {
    const date = formatFullDate(new Date());
    return `Sent with Proton Mail secure email.
------- Original Message -------
On ${date}, ${fromFields.fromName} <${fromFields.fromAddress}> wrote:


> ${referenceMessageBody}`;
};
