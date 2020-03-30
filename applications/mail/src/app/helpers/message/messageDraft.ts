import { c } from 'ttag';
import { setBit } from 'proton-shared/lib/helpers/bitset';
import { unique } from 'proton-shared/lib/helpers/array';
import { Address } from 'proton-shared/lib/interfaces';

import { Message, MessageExtended, EmbeddedMap } from '../../models/message';
import { Recipient } from '../../models/address';
import { MESSAGE_ACTIONS, MESSAGE_FLAGS } from '../../constants';
import { MailSettings } from '../../models/utils';
import { findSender } from '../addresses';
import { Attachment } from '../../models/attachment';
import { insertSignature } from './messageSignature';
import { formatFullDate } from '../date';
import { recipientToInput } from '../addresses';
import { getDate } from '../elements';
import { isSent, isSentAndReceived, getOriginalTo } from './messages';
import { getContent } from './messageContent';
import { EmbeddedInfo } from '../../models/message';
import { parseInDiv } from '../dom';
import { generateUID } from 'react-components';

// Reference: Angular/src/app/message/services/messageBuilder.js

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
 * Format and build a new message
 * TODO: Define if referenceMessage could ever be defined
 */
const newCopy = (
    {
        data: { Subject = '', ToList = [], CCList = [], BCCList = [] } = {},
        encryptedSubject = ''
    }: Partial<MessageExtended> = {},
    useEncrypted = false
): Message => {
    return {
        Subject: useEncrypted ? encryptedSubject : Subject,
        ToList,
        CCList,
        BCCList
    };
};

/**
 * Format and build a reply
 */
const reply = (referenceMessage: Partial<MessageExtended> = {}, useEncrypted = false): Message => {
    const Subject = formatSubject(
        useEncrypted ? referenceMessage.encryptedSubject : referenceMessage.data?.Subject,
        RE_PREFIX
    );
    const ToList =
        isSent(referenceMessage.data) || isSentAndReceived(referenceMessage.data)
            ? referenceMessage.data?.ToList
            : referenceMessage.data?.ReplyTos;

    return {
        Subject,
        ToList
    };
};

/**
 * Format and build a replyAll
 */
const replyAll = (
    referenceMessage: Partial<MessageExtended> = {},
    useEncrypted = false,
    addresses: Address[]
): Message => {
    const { data = {}, encryptedSubject = '' } = referenceMessage;

    const Subject = formatSubject(useEncrypted ? encryptedSubject : data.Subject, RE_PREFIX);

    if (isSent(referenceMessage.data) || isSentAndReceived(referenceMessage.data)) {
        return { Subject, ToList: data.ToList, CCList: data.CCList, BCCList: data.BCCList };
    }

    const ToList = data.ReplyTos;

    // Remove user address in CCList and ToList
    const userAddresses = addresses.map(({ Email = '' }) => Email.toLowerCase());
    const CCListWithoutUserAddresses: Recipient[] = unique([...(data.ToList || []), ...(data.CCList || [])]);
    const CCList = CCListWithoutUserAddresses.filter(
        ({ Address = '' }) => !userAddresses.includes(Address.toLowerCase())
    );

    return { Subject, ToList, CCList };
};

/**
 * Format and build a forward
 */
const forward = (
    { data = {}, encryptedSubject = '' }: Partial<MessageExtended> = {},
    useEncrypted = false
): Message => {
    const Subject = formatSubject(useEncrypted ? encryptedSubject : data.Subject, FW_PREFIX);

    return { Subject, ToList: [] };
};

export const handleActions = (
    action: MESSAGE_ACTIONS,
    referenceMessage: Partial<MessageExtended> = {},
    addresses: Address[] = []
): Message => {
    // TODO: I would prefere manage a confirm modal from elsewhere
    // const useEncrypted = !!referenceMessage.encryptedSubject && (await promptEncryptedSubject(currentMsg));
    const useEncrypted = !!referenceMessage?.encryptedSubject;

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
const generateBlockquote = (referenceMessage: Partial<MessageExtended>) => {
    const date = formatFullDate(getDate(referenceMessage?.data));
    const sender = recipientToInput(referenceMessage?.data?.Sender);
    const previously = c('Message').t`On ${date}, ${sender} wrote:`;

    // TODO
    // const newContent =
    //     referenceMessage.data?.MIMEType === MIME_TYPES.PLAINTEXT ? textToHtmlMail.parse(content) : content;
    // TODO: To check... Should use transformations from useMessage
    // newContent = prepareContent(content, referenceMessage, ['*'], action);
    // const newContent = referenceMessage.content;

    return `<div class="protonmail_quote">
        ${ORIGINAL_MESSAGE}<br>
        ${previously}<br>
        <blockquote class="protonmail_quote" type="cite">
            ${getContent(referenceMessage || {})}
        </blockquote><br>
    </div>`;
};

export const createNewDraft = (
    action: MESSAGE_ACTIONS,
    referenceMessage: Partial<MessageExtended> | undefined,
    mailSettings: MailSettings,
    addresses: Address[]
): MessageExtended => {
    const MIMEType = referenceMessage?.data?.MIMEType || mailSettings.DraftMIMEType;
    const RightToLeft = mailSettings.RightToLeft;

    let Flags = 0;
    if (mailSettings.AttachPublicKey) {
        Flags = setBit(Flags, MESSAGE_FLAGS.FLAG_PUBLIC_KEY);
    }
    if (mailSettings.Sign) {
        Flags = setBit(Flags, MESSAGE_FLAGS.FLAG_SIGN);
    }

    const { Subject, ToList = [], CCList = [], BCCList = [] } = handleActions(action, referenceMessage, addresses);

    const originalTo = getOriginalTo(referenceMessage?.data);

    const senderAddress = findSender(addresses, referenceMessage?.data);

    const AddressID = senderAddress?.ID; // Set the AddressID from previous message to convert attachments on reply / replyAll / forward
    const Sender = {
        Name: senderAddress?.DisplayName,
        Address: senderAddress?.Email
    };

    const embeddeds: EmbeddedMap = new Map<string, EmbeddedInfo>();
    const Attachments: Attachment[] = [];

    referenceMessage?.embeddeds?.forEach((value, key) => {
        embeddeds.set(key, value);
        Attachments.push(value.attachment);
    });

    const ParentID = action === MESSAGE_ACTIONS.NEW ? undefined : referenceMessage?.data?.ID;

    let content = action === MESSAGE_ACTIONS.NEW ? '' : generateBlockquote(referenceMessage || {});
    content = insertSignature(content, senderAddress?.Signature, action, mailSettings);
    const document = parseInDiv(content);

    return {
        localID: generateUID(DRAFT_ID_PREFIX),
        data: {
            ToList,
            CCList,
            BCCList,
            Subject,
            PasswordHint: '',
            ExpirationTime: 0,
            ExpiresIn: 0,
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
        action,
        originalTo,
        initialized: true,
        embeddeds
    };
};

export const cloneDraft = (draft: MessageExtended): MessageExtended => {
    return {
        ...draft,
        data: { ...draft.data },
        document: draft.document?.cloneNode(true) as Element
    };
};

export const isNewDraft = (localID: string) => localID.startsWith(DRAFT_ID_PREFIX);
