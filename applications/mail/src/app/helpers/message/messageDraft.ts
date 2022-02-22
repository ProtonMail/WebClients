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
import { DecryptResultPmcrypto } from 'pmcrypto';
import { defaultFontStyle } from '@proton/components/components/editor/helpers';
import { MESSAGE_ACTIONS } from '../../constants';
import { getFromAddress } from '../addresses';
import { formatFullDate } from '../date';
import { parseInDiv } from '../dom';
import { getDate } from '../elements';
import { exportPlainText, getDocumentContent, plainTextToHTML } from './messageContent';
import { getEmbeddedImages, restoreImages, updateImages } from './messageImages';
import { insertSignature } from './messageSignature';
import { convertToFile } from '../attachment/attachmentConverter';
import { MessageStateWithData, PartialMessageState } from '../../logic/messages/messagesTypes';

// Reference: Angular/src/app/message/services/messageBuilder.js

export const CLASSNAME_BLOCKQUOTE = 'protonmail_quote';

/**
 * Copy embeddeds images from the reference message
 */
export const keepEmbeddeds = (message: PartialMessageState) => {
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
const reply = (referenceMessage: PartialMessageState, useEncrypted = false): PartialMessageState => {
    const Subject = formatSubject(
        useEncrypted ? referenceMessage.decryption?.decryptedSubject : referenceMessage.data?.Subject,
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
    referenceMessage: PartialMessageState,
    useEncrypted = false,
    addresses: Address[]
): PartialMessageState => {
    const { data = {}, decryption: { decryptedSubject = '' } = {} } = referenceMessage;

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
const forward = (referenceMessage: PartialMessageState, useEncrypted = false): PartialMessageState => {
    const { data, decryption: { decryptedSubject = '' } = {} } = referenceMessage;
    const Subject = formatSubject(useEncrypted ? decryptedSubject : data?.Subject, FW_PREFIX);
    const Attachments = data?.Attachments;

    const { messageImages } = keepEmbeddeds(referenceMessage);

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

/**
 * Generate blockquote of the referenced message to the content of the new mail
 */
const generateBlockquote = (
    referenceMessage: PartialMessageState,
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
        ? plainTextToHTML(
              referenceMessage.data as Message,
              referenceMessage.decryption?.decryptedBody,
              mailSettings,
              addresses
          )
        : getDocumentContent(restoreImages(referenceMessage.messageDocument?.document, referenceMessage.messageImages));

    return `<div class="${CLASSNAME_BLOCKQUOTE}">
        ${ORIGINAL_MESSAGE}<br>
        ${previously}<br><br>
        <blockquote class="${CLASSNAME_BLOCKQUOTE}" type="cite">
            ${previousContent}
        </blockquote><br>
    </div>`;
};

export const createNewDraft = (
    action: MESSAGE_ACTIONS,
    referenceMessage: PartialMessageState | undefined,
    mailSettings: MailSettings,
    addresses: Address[],
    getAttachment: (ID: string) => DecryptResultPmcrypto | undefined,
    isOutside = false
): PartialMessageState => {
    const MIMEType = isOutside
        ? (mailSettings.DraftMIMEType as unknown as MIME_TYPES)
        : referenceMessage?.data?.MIMEType || (mailSettings.DraftMIMEType as unknown as MIME_TYPES);
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
    const initialAttachments = [...(referenceMessage?.draftFlags?.initialAttachments || []), ...pgpAttachments];

    const senderAddress = getFromAddress(addresses, originalTo, referenceMessage?.data?.AddressID);

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
            : generateBlockquote(referenceMessage || {}, mailSettings, addresses);

    const fontStyle = defaultFontStyle({ FontFace, FontSize });

    content =
        action === MESSAGE_ACTIONS.NEW && referenceMessage?.decryption?.decryptedBody
            ? insertSignature(content, senderAddress?.Signature, action, mailSettings, fontStyle, true)
            : insertSignature(content, senderAddress?.Signature, action, mailSettings, fontStyle);

    const plain = isPlainText({ MIMEType });
    const document = plain ? undefined : parseInDiv(content);

    // Prevent nested ternary
    const getPlainTextContent = (content: string) => {
        const exported = exportPlainText(content);
        return exported === '' ? '' : `\n\n${exported}`;
    };

    const plainText = plain ? getPlainTextContent(content) : undefined;

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
            originalAddressID,
            initialAttachments,
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
