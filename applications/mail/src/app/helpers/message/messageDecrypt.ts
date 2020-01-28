import { decryptMIMEMessage, decryptMessageLegacy } from 'pmcrypto';
import { MIME_TYPES } from 'proton-shared/lib/constants';
import { c } from 'ttag';

import { Message, MessageExtended } from '../../models/message';
import { convert } from '../attachment/attachmentConverter';
import { VERIFICATION_STATUS } from '../../constants';
import { getDate } from './messages';
import { AttachmentsDataCache } from '../../hooks/useAttachments';

const getVerifiedStatus = (pmcryptoVerified: number, publicKeys: any) => {
    const signedInvalid = VERIFICATION_STATUS.SIGNED_AND_INVALID;
    const signedPubkey = VERIFICATION_STATUS.SIGNED_NO_PUB_KEY;
    return !publicKeys.length && pmcryptoVerified === signedInvalid ? signedPubkey : pmcryptoVerified;
};

export const decryptMimeMessage = async (
    message: Message,
    privateKeys: any,
    publicKeys: any,
    attachmentsCache: AttachmentsDataCache
): Promise<MessageExtended> => {
    const headerFilename = c('Encrypted Headers').t`Encrypted Headers filename`;
    const sender = (message.Sender || {}).Address;

    const result = await decryptMIMEMessage({
        message: message.Body,
        messageDate: getDate(message),
        privateKeys,
        publicKeys,
        headerFilename,
        sender
    });

    const { body = c('Message empty').t`Message content if empty`, mimetype = MIME_TYPES.PLAINTEXT } =
        (await result.getBody()) || {};

    const verified = getVerifiedStatus(await result.verify(), publicKeys);

    const attachments = convert(message, await result.getAttachments(), verified, attachmentsCache);
    const encryptedSubject = await result.getEncryptedSubject();

    return { raw: body, data: { ...message, Attachments: attachments }, verified, encryptedSubject, mimetype };
};

export const decryptLegacyMessage = async (
    message: Message,
    privateKeys: any,
    publicKeys: any
): Promise<MessageExtended> => {
    const { data, verified: pmcryptoVerified = VERIFICATION_STATUS.NOT_SIGNED } = (await decryptMessageLegacy({
        message: message.Body,
        messageDate: getDate(message),
        privateKeys,
        publicKeys
    })) as any;

    const verified = getVerifiedStatus(pmcryptoVerified, publicKeys);

    return { raw: data, verified, publicKeys, privateKeys };
};
