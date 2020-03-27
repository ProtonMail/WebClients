import { decryptMIMEMessage, decryptMessageLegacy, OpenPGPKey } from 'pmcrypto';
import { c } from 'ttag';

import { Message } from '../../models/message';
import { convert } from '../attachment/attachmentConverter';
import { VERIFICATION_STATUS } from '../../constants';
import { getDate, getSender, isMIME } from './messages';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { Attachment } from '../../models/attachment';

const getVerifiedStatus = (pmcryptoVerified: number, publicKeys: any) => {
    const signedInvalid = VERIFICATION_STATUS.SIGNED_AND_INVALID;
    const signedPubkey = VERIFICATION_STATUS.SIGNED_NO_PUB_KEY;
    return !publicKeys.length && pmcryptoVerified === signedInvalid ? signedPubkey : pmcryptoVerified;
};

const decryptMimeMessage = async (
    message: Message,
    publicKeys: OpenPGPKey[],
    privateKeys: OpenPGPKey[],
    attachmentsCache: AttachmentsCache
) => {
    const headerFilename = c('Encrypted Headers').t`Encrypted Headers filename`;
    const sender = getSender(message)?.Address;

    const result = await decryptMIMEMessage({
        message: message?.Body,
        messageDate: getDate(message),
        privateKeys: privateKeys,
        publicKeys: publicKeys,
        headerFilename,
        sender
    });

    const {
        body: decryptedBody = c('Message empty').t`Message content if empty`
        // , mimetype = MIME_TYPES.PLAINTEXT
    } = (await result.getBody()) || {};

    const verified = getVerifiedStatus(await result.verify(), publicKeys);

    const Attachments = convert(message, await result.getAttachments(), verified, attachmentsCache);
    const encryptedSubject = await result.getEncryptedSubject();

    return {
        decryptedBody,
        Attachments,
        verified,
        encryptedSubject
        // mimetype
    };
};

const decryptLegacyMessage = async (message: Message, publicKeys: OpenPGPKey[], privateKeys: OpenPGPKey[]) => {
    const { data, verified: pmcryptoVerified = VERIFICATION_STATUS.NOT_SIGNED } = (await decryptMessageLegacy({
        message: message?.Body,
        messageDate: getDate(message),
        privateKeys: privateKeys,
        publicKeys: publicKeys
    })) as any;

    const verified = getVerifiedStatus(pmcryptoVerified, publicKeys);

    return { decryptedBody: data, verified };
};

export const decryptMessage = async (
    message: Message,
    publicKeys: OpenPGPKey[],
    privateKeys: OpenPGPKey[],
    attachmentsCache: AttachmentsCache
): Promise<{
    decryptedBody: string;
    Attachments?: Attachment[];
    verified?: number;
    encryptedSubject?: string;
}> => {
    if (isMIME(message)) {
        return decryptMimeMessage(message, publicKeys, privateKeys, attachmentsCache);
    } else {
        return decryptLegacyMessage(message, publicKeys, privateKeys);
    }
};
