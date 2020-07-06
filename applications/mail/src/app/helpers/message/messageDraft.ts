import { MIME_TYPES } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { setBit } from 'proton-shared/lib/helpers/bitset';
import { unique } from 'proton-shared/lib/helpers/array';
import { Address, MailSettings } from 'proton-shared/lib/interfaces';
import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { generateUID } from 'react-components';

import { EmbeddedMap, MessageExtendedWithData, PartialMessageExtended, MessageExtended } from '../../models/message';
import { MESSAGE_ACTIONS, MESSAGE_FLAGS } from '../../constants';
import { findSender } from '../addresses';
import { Attachment } from '../../models/attachment';
import { insertSignature } from './messageSignature';
import { formatFullDate } from '../date';
import { getDate } from '../elements';
import { isSent, isSentAndReceived, getOriginalTo, isPlainText } from './messages';
import { exportPlainText, plainTextToHTML, getDocumentContent } from './messageContent';
import { parseInDiv } from '../dom';
import { createEmbeddedMap } from '../embedded/embeddeds';

// Reference: Angular/src/app/message/services/messageBuilder.js

export const CLASSNAME_BLOCKQUOTE = 'protonmail_quote';
export const DRAFT_ID_PREFIX = 'draft';
export const ORIGINAL_MESSAGE = `‐‐‐‐‐‐‐ Original Message ‐‐‐‐‐‐‐`;
export const RE_PREFIX = c('Message').t`Re:`;
export const FW_PREFIX = c('Message').t`Fw:`;

/**
 * Format the subject to add the prefix only when the subject
 * doesn't start with it
 */
export const formatSubject = (subject = '', prefix = '') => {
    const hasPrefix = new RegExp(`^${prefix}`, 'i');
    return hasPrefix.test(subject) ? subject : `${prefix} ${subject}`;
};

/**
 * Copy embeddeds images from the reference message
 */
export const keepEmbeddeds = (refEmbeddeds?: EmbeddedMap) => {
    if (!refEmbeddeds) {
        return {};
    }

    const Attachments: Attachment[] = [];
    const embeddeds: EmbeddedMap = createEmbeddedMap();

    refEmbeddeds.forEach((value, key) => {
        embeddeds.set(key, value);
        Attachments.push(value.attachment);
    });

    return { Attachments, embeddeds };
};

/**
 * Format and build a new message
 * TODO: Define if referenceMessage could ever be defined
 */
const newCopy = (
    {
        data: { Subject = '', ToList = [], CCList = [], BCCList = [] } = {},
        decryptedSubject = ''
    }: PartialMessageExtended = {},
    useEncrypted = false
): PartialMessageExtended => {
    return {
        data: { Subject: useEncrypted ? decryptedSubject : Subject, ToList, CCList, BCCList }
    };
};

/**
 * Format and build a reply
 */
const reply = (referenceMessage: PartialMessageExtended, useEncrypted = false): PartialMessageExtended => {
    const Subject = formatSubject(
        useEncrypted ? referenceMessage.decryptedSubject : referenceMessage.data?.Subject,
        RE_PREFIX
    );
    const ToList =
        isSent(referenceMessage.data) || isSentAndReceived(referenceMessage.data)
            ? referenceMessage.data?.ToList
            : referenceMessage.data?.ReplyTos;

    const { Attachments, embeddeds } = keepEmbeddeds(referenceMessage.embeddeds);

    return {
        data: { Subject, ToList, Attachments },
        embeddeds
    };
};

/**
 * Format and build a replyAll
 */
const replyAll = (
    referenceMessage: PartialMessageExtended,
    useEncrypted = false,
    addresses: Address[]
): PartialMessageExtended => {
    const { data = {}, decryptedSubject = '' } = referenceMessage;

    const Subject = formatSubject(useEncrypted ? decryptedSubject : data.Subject, RE_PREFIX);

    const { Attachments, embeddeds } = keepEmbeddeds(referenceMessage.embeddeds);

    if (isSent(referenceMessage.data) || isSentAndReceived(referenceMessage.data)) {
        return {
            data: { Subject, ToList: data.ToList, CCList: data.CCList, BCCList: data.BCCList, Attachments },
            embeddeds
        };
    }

    const ToList = data.ReplyTos;

    // Remove user address in CCList and ToList
    const userAddresses = addresses.map(({ Email = '' }) => Email.toLowerCase());
    const CCListWithoutUserAddresses: Recipient[] = unique([...(data.ToList || []), ...(data.CCList || [])]);
    const CCList = CCListWithoutUserAddresses.filter(
        ({ Address = '' }) => !userAddresses.includes(Address.toLowerCase())
    );

    return { data: { Subject, ToList, CCList, Attachments }, embeddeds };
};

/**
 * Format and build a forward
 */
const forward = (
    { data, decryptedSubject = '' }: PartialMessageExtended,
    useEncrypted = false
): PartialMessageExtended => {
    const Subject = formatSubject(useEncrypted ? decryptedSubject : data?.Subject, FW_PREFIX);
    const Attachments = data?.Attachments;

    return { data: { Subject, ToList: [], Attachments } };
};

export const handleActions = (
    action: MESSAGE_ACTIONS,
    referenceMessage: PartialMessageExtended = {},
    addresses: Address[] = []
): PartialMessageExtended => {
    // TODO: I would prefere manage a confirm modal from elsewhere
    // const useEncrypted = !!referenceMessage.encryptedSubject && (await promptEncryptedSubject(currentMsg));
    const useEncrypted = !!referenceMessage?.decryptedSubject;

    switch (action) {
        case MESSAGE_ACTIONS.NEW:
            return newCopy(referenceMessage, useEncrypted);
        case MESSAGE_ACTIONS.REPLY:
            return reply(referenceMessage, useEncrypted);
        case MESSAGE_ACTIONS.REPLY_ALL:
            return replyAll(referenceMessage, useEncrypted, addresses);
        case MESSAGE_ACTIONS.FORWARD:
            return forward(referenceMessage, useEncrypted);
        // No default needed as all enum values are addressed
    }
};

/**
 * Generate blockquote of the referenced message to the content of the new mail
 */
const generateBlockquote = (
    referenceMessage: PartialMessageExtended,
    mailSettings: MailSettings,
    addresses: Address[]
) => {
    const date = formatFullDate(getDate(referenceMessage?.data, ''));
    const name = referenceMessage?.data?.Sender?.Name;
    const address = `&lt;${referenceMessage?.data?.Sender?.Address}&gt;`;
    const previously = c('Message').t`On ${date}, ${name} ${address} wrote:`;
    const previousContent = isPlainText(referenceMessage.data)
        ? plainTextToHTML(referenceMessage as MessageExtended, mailSettings, addresses)
        : getDocumentContent(referenceMessage.document);

    return `<div class="${CLASSNAME_BLOCKQUOTE}">
        ${ORIGINAL_MESSAGE}<br>
        ${previously}<br>
        <blockquote class="${CLASSNAME_BLOCKQUOTE}" type="cite">
            ${previousContent}
        </blockquote><br>
    </div>`;
};

export const createNewDraft = (
    action: MESSAGE_ACTIONS,
    referenceMessage: PartialMessageExtended | undefined,
    mailSettings: MailSettings,
    addresses: Address[]
): PartialMessageExtended => {
    const MIMEType = referenceMessage?.data?.MIMEType || ((mailSettings.DraftMIMEType as unknown) as MIME_TYPES);
    const RightToLeft = mailSettings.RightToLeft;

    let Flags = 0;
    if (mailSettings.AttachPublicKey) {
        Flags = setBit(Flags, MESSAGE_FLAGS.FLAG_PUBLIC_KEY);
    }
    if (mailSettings.Sign) {
        Flags = setBit(Flags, MESSAGE_FLAGS.FLAG_SIGN);
    }

    const {
        data: { Subject = '', ToList = [], CCList = [], BCCList = [], Attachments = [] } = {},
        embeddeds
    } = handleActions(action, referenceMessage, addresses);

    const originalTo = getOriginalTo(referenceMessage?.data);

    const senderAddress = findSender(addresses, referenceMessage?.data, true);

    const AddressID = senderAddress?.ID || ''; // Set the AddressID from previous message to convert attachments on reply / replyAll / forward
    const Sender = senderAddress ? { Name: senderAddress.DisplayName, Address: senderAddress.Email } : {};

    const ParentID = action === MESSAGE_ACTIONS.NEW ? undefined : referenceMessage?.data?.ID;

    let content =
        action === MESSAGE_ACTIONS.NEW ? '' : generateBlockquote(referenceMessage || {}, mailSettings, addresses);
    content = insertSignature(content, senderAddress?.Signature, action, mailSettings);

    const plain = isPlainText({ MIMEType });
    const document = plain ? undefined : parseInDiv(content);
    const plainText = plain ? exportPlainText(content) : undefined;

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
            Unread: 0
        },
        ParentID,
        document,
        plainText,
        action,
        expiresIn: 0,
        originalTo,
        initialized: true,
        embeddeds
    };
};

export const cloneDraft = (draft: MessageExtendedWithData): MessageExtendedWithData => {
    return {
        ...draft,
        data: { ...draft.data },
        document: draft.document?.cloneNode(true) as Element
    };
};

export const isNewDraft = (localID: string) => localID.startsWith(DRAFT_ID_PREFIX);
