import { MIME_TYPES } from '@proton/shared/lib/constants';
import { unique } from '@proton/shared/lib/helpers/array';
import { setBit } from '@proton/shared/lib/helpers/bitset';
import { canonizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { Address, MailSettings } from '@proton/shared/lib/interfaces';
import { Recipient } from '@proton/shared/lib/interfaces/Address';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
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
} from '@proton/shared/lib/mail/messages';
import { generateUID } from '@proton/components';
import { c } from 'ttag';
import { DEFAULT_FONT_FACE, DEFAULT_FONT_SIZE } from '@proton/components/components/editor/squireConfig';
import { DecryptResultPmcrypto } from 'pmcrypto';
import { MessageExtendedWithData, PartialMessageExtended } from '../../models/message';
import { MESSAGE_ACTIONS } from '../../constants';
import { getFromAddress } from '../addresses';
import { formatFullDate } from '../date';
import { parseInDiv } from '../dom';
import { getDate } from '../elements';
import { exportPlainText, getDocumentContent, plainTextToHTML } from './messageContent';
import { getEmbeddedImages, restoreImages, updateImages } from './messageImages';
import { insertSignature } from './messageSignature';
import { convertToFile } from '../attachment/attachmentConverter';

// Reference: Angular/src/app/message/services/messageBuilder.js

export const CLASSNAME_BLOCKQUOTE = 'protonmail_quote';

/**
 * Copy embeddeds images from the reference message
 */
export const keepEmbeddeds = (message: PartialMessageExtended) => {
    const embeddedImages = getEmbeddedImages(message);
    const Attachments = embeddedImages.map((image) => image.attachment);
    const messageImages = updateImages(message.messageImages, undefined, [], embeddedImages);

    return { Attachments, messageImages };
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

    const { Attachments, messageImages } = keepEmbeddeds(referenceMessage);

    return {
        data: { Subject, ToList, Attachments },
        messageImages,
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

    const { Attachments, messageImages } = keepEmbeddeds(referenceMessage);

    if (isSent(referenceMessage.data) || isSentAndReceived(referenceMessage.data)) {
        return {
            data: { Subject, ToList: data.ToList, CCList: data.CCList, BCCList: data.BCCList, Attachments },
            messageImages,
        };
    }

    const ToList = data.ReplyTos;

    // Remove user address in CCList and ToList
    const userAddresses = addresses.map(({ Email = '' }) => canonizeInternalEmail(Email));
    const CCListAll: Recipient[] = unique([...(data.ToList || []), ...(data.CCList || [])]);
    const CCList = CCListAll.filter(({ Address = '' }) => !userAddresses.includes(canonizeInternalEmail(Address)));

    return { data: { Subject, ToList, CCList, Attachments }, messageImages };
};

/**
 * Format and build a forward
 */
const forward = (referenceMessage: PartialMessageExtended, useEncrypted = false): PartialMessageExtended => {
    const { data, decryptedSubject = '' } = referenceMessage;
    const Subject = formatSubject(useEncrypted ? decryptedSubject : data?.Subject, FW_PREFIX);
    const Attachments = data?.Attachments;

    const { messageImages } = keepEmbeddeds(referenceMessage);

    return { data: { Subject, ToList: [], Attachments }, messageImages };
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
    const date = formatFullDate(getDate(referenceMessage?.data as Message, ''));
    const name = referenceMessage?.data?.Sender?.Name;
    const address = `&lt;${referenceMessage?.data?.Sender?.Address}&gt;`;
    const previously = c('Message').t`On ${date}, ${name} ${address} wrote:`;
    const previousContent = referenceMessage.errors?.decryption
        ? referenceMessage.data?.Body
        : isPlainText(referenceMessage.data)
        ? plainTextToHTML(referenceMessage.data as Message, referenceMessage.decryptedBody, mailSettings, addresses)
        : getDocumentContent(restoreImages(referenceMessage.document, referenceMessage.messageImages));

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
    addresses: Address[],
    getAttachment: (ID: string) => DecryptResultPmcrypto | undefined
): PartialMessageExtended => {
    const MIMEType = referenceMessage?.data?.MIMEType || (mailSettings.DraftMIMEType as unknown as MIME_TYPES);
    const { FontFace, FontSize, RightToLeft } = mailSettings;

    let Flags = 0;
    if (mailSettings.AttachPublicKey) {
        Flags = setBit(Flags, MESSAGE_FLAGS.FLAG_PUBLIC_KEY);
    }
    if (mailSettings.Sign) {
        Flags = setBit(Flags, MESSAGE_FLAGS.FLAG_SIGN);
    }

    const {
        data: { Subject = '', ToList = [], CCList = [], BCCList = [], Attachments: reusedAttachments = [] } = {},
        messageImages,
    } = handleActions(action, referenceMessage, addresses);

    // If there were some pgp attachments, need to upload them as "initialAttachments"
    const [Attachments, pgpAttachments] = convertToFile(reusedAttachments, getAttachment);

    const originalTo = getOriginalTo(referenceMessage?.data);
    const originalAddressID = referenceMessage?.data?.AddressID;
    const initialAttachments = [...(referenceMessage?.initialAttachments || []), ...pgpAttachments];

    const senderAddress = getFromAddress(addresses, originalTo, referenceMessage?.data?.AddressID);

    const AddressID = senderAddress?.ID || ''; // Set the AddressID from previous message to convert attachments on reply / replyAll / forward
    const Sender = senderAddress
        ? { Name: senderAddress.DisplayName, Address: senderAddress.Email }
        : { Name: '', Address: '' };

    const ParentID = action === MESSAGE_ACTIONS.NEW ? undefined : referenceMessage?.data?.ID;

    let content =
        action === MESSAGE_ACTIONS.NEW
            ? referenceMessage?.decryptedBody
                ? referenceMessage?.decryptedBody
                : ''
            : generateBlockquote(referenceMessage || {}, mailSettings, addresses);
    content =
        action === MESSAGE_ACTIONS.NEW && referenceMessage?.decryptedBody
            ? insertSignature(content, senderAddress?.Signature, action, mailSettings, true)
            : insertSignature(content, senderAddress?.Signature, action, mailSettings);

    content =
        FontFace || FontSize
            ? `<div style="font-family: ${FontFace || DEFAULT_FONT_FACE}; font-size: ${
                  FontSize ? `${FontSize}px` : `${DEFAULT_FONT_SIZE}px`
              };">${content}</div>`
            : content;

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
        originalTo,
        originalAddressID,
        initialized: true,
        messageImages,
        initialAttachments,
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
