import { decryptMIMEMessage, decryptMessageLegacy } from 'pmcrypto';
import { c } from 'ttag';

import { MessageExtended } from '../../models/message';
import { convert } from '../attachment/attachmentConverter';
import { VERIFICATION_STATUS } from '../../constants';
import { getDate, getSender } from './messages';
import { AttachmentsCache } from '../../containers/AttachmentProvider';

const getVerifiedStatus = (pmcryptoVerified: number, publicKeys: any) => {
    const signedInvalid = VERIFICATION_STATUS.SIGNED_AND_INVALID;
    const signedPubkey = VERIFICATION_STATUS.SIGNED_NO_PUB_KEY;
    return !publicKeys.length && pmcryptoVerified === signedInvalid ? signedPubkey : pmcryptoVerified;
};

export const decryptMimeMessage = async (
    message: MessageExtended,
    attachmentsCache: AttachmentsCache
): Promise<MessageExtended> => {
    const headerFilename = c('Encrypted Headers').t`Encrypted Headers filename`;
    const sender = getSender(message.data)?.Address;

    const result = await decryptMIMEMessage({
        message: message.data?.Body,
        messageDate: getDate(message.data),
        privateKeys: message.privateKeys,
        publicKeys: message.publicKeys,
        headerFilename,
        sender
    });

    const {
        body = c('Message empty').t`Message content if empty`
        // , mimetype = MIME_TYPES.PLAINTEXT
    } = (await result.getBody()) || {};

    const verified = getVerifiedStatus(await result.verify(), message.publicKeys);

    const attachments = convert(message.data, await result.getAttachments(), verified, attachmentsCache);
    const encryptedSubject = await result.getEncryptedSubject();

    return {
        decryptedBody: body,
        data: { ...message, Attachments: attachments },
        verified,
        encryptedSubject
        // mimetype
    };
};

export const decryptLegacyMessage = async (message: MessageExtended): Promise<MessageExtended> => {
    const { data, verified: pmcryptoVerified = VERIFICATION_STATUS.NOT_SIGNED } = (await decryptMessageLegacy({
        message: message.data?.Body,
        messageDate: getDate(message.data),
        privateKeys: message.privateKeys,
        publicKeys: message.publicKeys
    })) as any;

    const verified = getVerifiedStatus(pmcryptoVerified, message.publicKeys);

    return { decryptedBody: data, verified };
};
