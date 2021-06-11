import { MIME_TYPES } from 'proton-shared/lib/constants';
import { unique } from 'proton-shared/lib/helpers/array';
import { setBit } from 'proton-shared/lib/helpers/bitset';
import { canonizeInternalEmail } from 'proton-shared/lib/helpers/email';
import { Address, MailSettings } from 'proton-shared/lib/interfaces';
import { Recipient } from 'proton-shared/lib/interfaces/Address';
import { Attachment, Message } from 'proton-shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from 'proton-shared/lib/mail/constants';
import {
    DRAFT_ID_PREFIX,
    formatSubject,
    FW_PREFIX,
    getOriginalTo,
    isPlainText,
    isSent,
    isSentAndReceived,
    ORIGINAL_MESSAGE,
    RE_PREFIX,
} from 'proton-shared/lib/mail/messages';
import { generateUID } from 'react-components';
import { c } from 'ttag';

import { EmbeddedMap, MessageExtendedWithData, PartialMessageExtended } from '../../models/message';
import { getFromAddress } from '../addresses';
import { formatFullDate } from '../date';
import { parseInDiv } from '../dom';
import { getDate } from '../elements';
import { createEmbeddedMap } from '../embedded/embeddeds';
import { exportPlainText, getDocumentContent, plainTextToHTML } from './messageContent';
import { insertSignature } from './messageSignature';
import { MESSAGE_ACTIONS } from '../../constants';

// Reference: Angular/src/app/message/services/messageBuilder.js

export const CLASSNAME_BLOCKQUOTE = 'protonmail_quote';

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
        decryptedSubject = '',
    }: PartialMessageExtended = {},
    useEncrypted = false
): PartialMessageExtended => {
    return {
        data: { Subject: useEncrypted ? decryptedSubject : Subject, ToList, CCList, BCCList },
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
        embeddeds,
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
            embeddeds,
        };
    }

    const ToList = data.ReplyTos;

    // Remove user address in CCList and ToList
    const userAddresses = addresses.map(({ Email = '' }) => canonizeInternalEmail(Email));
    const CCListAll: Recipient[] = unique([...(data.ToList || []), ...(data.CCList || [])]);
    const CCList = CCListAll.filter(({ Address = '' }) => !userAddresses.includes(canonizeInternalEmail(Address)));

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
    const previousContent = referenceMessage.errors?.decryption
        ? referenceMessage.data?.Body
        : isPlainText(referenceMessage.data)
        ? plainTextToHTML(referenceMessage.data as Message, referenceMessage.decryptedBody, mailSettings, addresses)
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
    const { RightToLeft } = mailSettings;

    let Flags = 0;
    if (mailSettings.AttachPublicKey) {
        Flags = setBit(Flags, MESSAGE_FLAGS.FLAG_PUBLIC_KEY);
    }
    if (mailSettings.Sign) {
        Flags = setBit(Flags, MESSAGE_FLAGS.FLAG_SIGN);
    }

    const {
        data: { Subject = '', ToList = [], CCList = [], BCCList = [], Attachments = [] } = {},
        embeddeds,
    } = handleActions(action, referenceMessage, addresses);

    const originalTo = getOriginalTo(referenceMessage?.data);
    const originalAddressID = referenceMessage?.data?.AddressID;
    const initialAttachments = referenceMessage?.initialAttachments;

    const senderAddress = getFromAddress(addresses, originalTo, referenceMessage?.data?.AddressID);

    const AddressID = senderAddress?.ID || ''; // Set the AddressID from previous message to convert attachments on reply / replyAll / forward
    const Sender = senderAddress
        ? { Name: senderAddress.DisplayName, Address: senderAddress.Email }
        : { Name: '', Address: '' };

    const ParentID = action === MESSAGE_ACTIONS.NEW ? undefined : referenceMessage?.data?.ID;

    let content =
        action === MESSAGE_ACTIONS.NEW ? '' : generateBlockquote(referenceMessage || {}, mailSettings, addresses);
    content = insertSignature(content, senderAddress?.Signature, action, mailSettings);

    const plain = isPlainText({ MIMEType });
    const document = plain ? undefined : parseInDiv(content);
    const plainText = plain ? `\n\n${exportPlainText(content)}` : undefined;

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
        ParentID,
        document,
        plainText,
        action,
        expiresIn: 0,
        originalTo,
        originalAddressID,
        initialized: true,
        embeddeds,
        initialAttachments,
        inComposer: true,
    };
};

export const cloneDraft = (draft: MessageExtendedWithData): MessageExtendedWithData => {
    return {
        ...draft,
        data: { ...draft.data },
        document: draft.document?.cloneNode(true) as Element,
    };
};

export const isNewDraft = (localID: string | undefined) => !!localID?.startsWith(DRAFT_ID_PREFIX);
