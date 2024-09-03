import { c } from 'ttag';

import generateUID from '@proton/atoms/generateUID';
import { defaultFontStyle } from '@proton/components/components/editor/helpers';
import type { WorkerDecryptionResult } from '@proton/crypto';
import type { MIME_TYPES } from '@proton/shared/lib/constants';
import { setBit } from '@proton/shared/lib/helpers/bitset';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type { Address, MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import type { Recipient } from '@proton/shared/lib/interfaces/Address';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import {
    DRAFT_ID_PREFIX,
    FORWARDED_MESSAGE,
    FW_PREFIX,
    RE_PREFIX,
    formatSubject,
    getOriginalTo,
    isPlainText,
    isSent,
    isSentAndReceived,
} from '@proton/shared/lib/mail/messages';
import unique from '@proton/utils/unique';

import { MESSAGE_ACTIONS } from '../../constants';
import type { MessageStateWithData, PartialMessageState } from '../../store/messages/messagesTypes';
import { getFromAddress } from '../addresses';
import { convertToFile } from '../attachment/attachmentConverter';
import { formatFullDate } from '../date';
import { getDate } from '../elements';
import { getExpiresIn } from '../expiration';
import { exportPlainText, getDocumentContent, plainTextToHTML } from './messageContent';
import { getEmbeddedImages, getRemoteImages, restoreImages, updateImages } from './messageImages';
import { insertSignature } from './messageSignature';

// Reference: Angular/src/app/message/services/messageBuilder.js

export const CLASSNAME_BLOCKQUOTE = 'protonmail_quote';

/**
 * Copy embeddeds images from the reference message
 */
export const keepImages = (message: PartialMessageState) => {
    const embeddedImages = getEmbeddedImages(message);
    const remoteImages = getRemoteImages(message);
    const Attachments = embeddedImages.map((image) => image.attachment);
    const messageImages = updateImages(message.messageImages, undefined, remoteImages, embeddedImages);

    return { Attachments, messageImages };
};

/**
 * Format and build a new message
 * TODO: Define if referenceMessage could ever be defined
 */
const newCopy = (
    {
        data: { Subject = '', ToList = [], CCList = [], BCCList = [] } = {},
        decryption: { decryptedSubject = '' } = {},
    }: PartialMessageState = {},
    useEncrypted = false
): PartialMessageState => {
    return {
        data: { Subject: useEncrypted ? decryptedSubject : Subject, ToList, CCList, BCCList },
    };
};

/**
 * Format and build a reply
 */
export const reply = (referenceMessage: PartialMessageState, useEncrypted = false): PartialMessageState => {
    const Subject = formatSubject(
        useEncrypted ? referenceMessage.decryption?.decryptedSubject : referenceMessage.data?.Subject,
        RE_PREFIX
    );
    const ToList =
        isSent(referenceMessage.data) || isSentAndReceived(referenceMessage.data)
            ? referenceMessage.data?.ToList
            : referenceMessage.data?.ReplyTos;

    const { Attachments, messageImages } = keepImages(referenceMessage);

    return {
        data: { Subject, ToList, Attachments },
        messageImages,
    };
};

/**
 * Format and build a replyAll
 */
export const replyAll = (
    referenceMessage: PartialMessageState,
    useEncrypted = false,
    addresses: Address[]
): PartialMessageState => {
    const { data = {}, decryption: { decryptedSubject = '' } = {} } = referenceMessage;

    const Subject = formatSubject(useEncrypted ? decryptedSubject : data.Subject, RE_PREFIX);

    const { Attachments, messageImages } = keepImages(referenceMessage);

    if (isSent(referenceMessage.data) || isSentAndReceived(referenceMessage.data)) {
        return {
            data: { Subject, ToList: data.ToList, CCList: data.CCList, BCCList: data.BCCList, Attachments },
            messageImages,
        };
    }

    const ToList = data.ReplyTos;

    const CCListAll: Recipient[] = unique([...(data.ToList || []), ...(data.CCList || [])]);

    // Keep other user addresses in the CC list, but remove the address on which the user received the message (using ref message addressID)
    const userAddress = canonicalizeInternalEmail(
        addresses.find((address) => address.ID === data.AddressID)?.Email || ''
    );
    const CCList: Recipient[] = CCListAll.filter(({ Address }) => canonicalizeInternalEmail(Address) !== userAddress);

    return { data: { Subject, ToList, CCList, Attachments }, messageImages };
};

/**
 * Format and build a forward
 */
const forward = (referenceMessage: PartialMessageState, useEncrypted = false): PartialMessageState => {
    const { data, decryption: { decryptedSubject = '' } = {} } = referenceMessage;
    const Subject = formatSubject(useEncrypted ? decryptedSubject : data?.Subject, FW_PREFIX);
    const Attachments = data?.Attachments;

    const { messageImages } = keepImages(referenceMessage);

    return { data: { Subject, ToList: [], Attachments }, messageImages };
};

export const handleActions = (
    action: MESSAGE_ACTIONS,
    referenceMessage: PartialMessageState = {},
    addresses: Address[] = []
): PartialMessageState => {
    // TODO: I would prefere manage a confirm modal from elsewhere
    // const useEncrypted = !!referenceMessage.encryptedSubject && (await promptEncryptedSubject(currentMsg));
    const useEncrypted = !!referenceMessage?.decryption?.decryptedSubject;

    switch (action) {
        case MESSAGE_ACTIONS.REPLY:
            return reply(referenceMessage, useEncrypted);
        case MESSAGE_ACTIONS.REPLY_ALL:
            return replyAll(referenceMessage, useEncrypted, addresses);
        case MESSAGE_ACTIONS.FORWARD:
            return forward(referenceMessage, useEncrypted);
        case MESSAGE_ACTIONS.NEW:
        default:
            return newCopy(referenceMessage, useEncrypted);
    }
};

export const getBlockquoteRecipientsString = (recipients: Recipient[] = []) => {
    return recipients
        .map((recipient) => {
            return `${recipient?.Name || recipient?.Address} &lt;${recipient?.Address}&gt;`;
        })
        .join(', ');
};

export const generatePreviousMessageInfos = (referenceMessage: PartialMessageState, action: MESSAGE_ACTIONS) => {
    const senderString = getBlockquoteRecipientsString([referenceMessage.data?.Sender] as Recipient[]);
    const date = formatFullDate(getDate(referenceMessage?.data as Message, ''));

    if (action === MESSAGE_ACTIONS.FORWARD) {
        const ccString = getBlockquoteRecipientsString(referenceMessage.data?.CCList as Recipient[]);
        const toString = getBlockquoteRecipientsString(referenceMessage.data?.ToList as Recipient[]);
        const ccRecipients = (referenceMessage.data?.CCList?.length || 0) > 0 ? `CC: ${ccString}<br>` : '';
        const subject = referenceMessage.data?.Subject;

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
    const previousContent = referenceMessage.errors?.decryption
        ? referenceMessage.data?.Body
        : isPlainText(referenceMessage.data)
          ? plainTextToHTML(
                referenceMessage.data as Message,
                referenceMessage.decryption?.decryptedBody,
                mailSettings,
                userSettings,
                addresses
            )
          : getDocumentContent(
                restoreImages(referenceMessage.messageDocument?.document, referenceMessage.messageImages)
            );

    const previousMessageInfos = generatePreviousMessageInfos(referenceMessage, action);

    return `<div class="${CLASSNAME_BLOCKQUOTE}">
        ${previousMessageInfos}
        <blockquote class="${CLASSNAME_BLOCKQUOTE}" type="cite">
            ${previousContent}
        </blockquote><br>
    </div>`;
};

export const createNewDraft = (
    action: MESSAGE_ACTIONS,
    referenceMessage: PartialMessageState | undefined,
    mailSettings: MailSettings,
    userSettings: UserSettings,
    addresses: Address[],
    getAttachment: (ID: string) => WorkerDecryptionResult<Uint8Array> | undefined,
    isOutside = false,
    isQuickReply = false
): PartialMessageState => {
    const MIMEType = isOutside
        ? (mailSettings.DraftMIMEType as unknown as MIME_TYPES)
        : referenceMessage?.data?.MIMEType || (mailSettings.DraftMIMEType as unknown as MIME_TYPES);
    const { RightToLeft } = mailSettings;

    let Flags = 0;
    if (mailSettings.AttachPublicKey) {
        Flags = setBit(Flags, MESSAGE_FLAGS.FLAG_PUBLIC_KEY);
    }

    const {
        data: { Subject = '', ToList = [], CCList = [], BCCList = [], Attachments: reusedAttachments = [] } = {},
        messageImages,
    } = handleActions(action, referenceMessage, addresses);

    // If there were some pgp attachments, need to upload them as "initialAttachments"
    const [Attachments, pgpAttachments] = convertToFile(reusedAttachments, getAttachment);

    const originalTo = getOriginalTo(referenceMessage?.data);
    const originalFrom = referenceMessage?.data?.Sender?.Address;
    const originalAddress =
        isSent(referenceMessage?.data) || isSentAndReceived(referenceMessage?.data) ? originalFrom : originalTo;
    const originalAddressID = referenceMessage?.data?.AddressID;
    const initialAttachments = [...(referenceMessage?.draftFlags?.initialAttachments || []), ...pgpAttachments];

    const senderAddress = getFromAddress(addresses, originalAddress, referenceMessage?.data?.AddressID);

    const AddressID = senderAddress?.ID || ''; // Set the AddressID from previous message to convert attachments on reply / replyAll / forward

    // When writing an EO message, we cannot use the Sender which has an external address, so we need to use the Recipient which is a PM address
    const Sender = isOutside
        ? { Name: referenceMessage?.data?.Sender?.Name || '', Address: referenceMessage?.data?.Sender?.Address || '' }
        : senderAddress
          ? { Name: senderAddress.DisplayName, Address: senderAddress.Email }
          : { Name: '', Address: '' };

    const ParentID = action === MESSAGE_ACTIONS.NEW ? undefined : referenceMessage?.data?.ID;

    let content =
        action === MESSAGE_ACTIONS.NEW
            ? referenceMessage?.decryption?.decryptedBody
                ? referenceMessage?.decryption?.decryptedBody
                : ''
            : generateBlockquote(referenceMessage || {}, mailSettings, userSettings, addresses, action);

    const fontStyle = defaultFontStyle(mailSettings);

    content =
        action === MESSAGE_ACTIONS.NEW && referenceMessage?.decryption?.decryptedBody
            ? insertSignature(content, senderAddress?.Signature, action, mailSettings, userSettings, fontStyle, true)
            : insertSignature(content, senderAddress?.Signature, action, mailSettings, userSettings, fontStyle);

    const plain = isPlainText({ MIMEType });
    const document = plain ? undefined : parseStringToDOM(content).body;

    // Prevent nested ternary
    const getPlainTextContent = (content: string) => {
        const exported = exportPlainText(content);
        return exported === '' ? '' : `\n\n${exported}`;
    };

    const plainText = plain ? getPlainTextContent(content) : undefined;
    let expiresIn: Date | undefined;

    if (action === MESSAGE_ACTIONS.REPLY || action === MESSAGE_ACTIONS.REPLY_ALL) {
        // Preset expiration time if it's set on the original message (use the difference between the expiration time and the receive time)
        expiresIn = getExpiresIn(referenceMessage?.data);
    }

    return {
        localID: generateUID(DRAFT_ID_PREFIX),
        data: {
            ToList,
            CCList,
            BCCList,
            Subject,
            PasswordHint: '',
            Attachments,
            MIMEType,
            RightToLeft,
            Flags,
            Sender,
            AddressID,
            Unread: 0,
        },
        messageDocument: {
            initialized: true,
            document,
            plainText,
        },
        draftFlags: {
            ParentID,
            action,
            originalTo,
            originalFrom,
            originalAddressID,
            originalMessageFlags: referenceMessage?.data?.Flags,
            initialAttachments,
            isQuickReply,
            expiresIn,
        },
        messageImages,
    };
};

export const cloneDraft = (draft: MessageStateWithData): MessageStateWithData => {
    return {
        ...draft,
        data: { ...draft.data },
        messageDocument: {
            ...draft.messageDocument,
            document: draft.messageDocument?.document?.cloneNode(true) as Element,
        },
    };
};

export const isNewDraft = (localID: string | undefined) => !!localID?.startsWith(DRAFT_ID_PREFIX);
