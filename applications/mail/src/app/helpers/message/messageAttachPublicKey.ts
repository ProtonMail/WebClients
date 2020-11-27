import { keyInfo } from 'pmcrypto/lib/pmcrypto';
import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';

import { MessageExtended, MessageExtendedWithData, MessageKeys } from '../../models/message';
import { upload, ATTACHMENT_ACTION } from '../attachment/attachmentUploader';

// TS Hack waiting for keyInfo to be completely typed
type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;
type KeyInfo = ThenArg<ReturnType<typeof keyInfo>>;

const ENCRYPTION_SIZE_SLACK = 0.2;

/**
 * Checks if the given blob equals the attachment that is already uploaded.
 * Size matching is done with some slack to take into account the difference between plaintext and encryption.
 *
 * The size can differ because the attachment is already encrypted
 */
const blobEqualsAttachment = (file: File, attachment: Attachment) =>
    attachment.Name === (file.name as string) &&
    attachment.MIMEType === file.type &&
    file.size > (1 - ENCRYPTION_SIZE_SLACK) * (attachment.Size || 0) &&
    file.size < (1 + ENCRYPTION_SIZE_SLACK) * (attachment.Size || 0);

/**
 * Generate a blob corresponding to the public key that is passed in. The name is extracted from the message the
 * key will be attached to.
 */
const fileFromKeyInfo = (message: MessageExtended, { publicKeyArmored, fingerprint }: KeyInfo) => {
    const name = `publickey - ${message.data?.Sender?.Address} - 0x${fingerprint.slice(0, 8).toUpperCase()}.asc`;
    return new File([publicKeyArmored], name, { type: 'application/pgp-keys' });
};

/**
 * Attaches the senders public key to the message
 */
export const attachPublicKey = async (message: MessageExtendedWithData, messageKeys: MessageKeys, uid: string) => {
    const attachments = message.data?.Attachments || [];

    const privateKeys = messageKeys.privateKeys?.[0];
    const info = await keyInfo(privateKeys.armor());
    const file = fileFromKeyInfo(message, info);
    const attachmentExists = attachments.some((attachment) => blobEqualsAttachment(file, attachment));

    if (attachmentExists) {
        return attachments;
    }

    const [uploadInfo] = upload([file], message, messageKeys, ATTACHMENT_ACTION.ATTACHMENT, uid);
    const uploadResult = await uploadInfo.resultPromise;
    return [...attachments, uploadResult.attachment];
};
