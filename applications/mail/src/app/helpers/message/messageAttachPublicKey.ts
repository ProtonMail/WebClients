import { CryptoProxy } from '@proton/crypto';
import type { MessageState, MessageStateWithData, PublicPrivateKey } from '@proton/mail/store/messages/messagesTypes';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { ATTACHMENT_DISPOSITION } from '@proton/shared/lib/mail/constants';

import { upload } from '../attachment/attachmentUploader';

interface KeyInfoForFile {
    fingerprint: string;
    publicKeyArmored: string;
}

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
const fileFromKeyInfo = (message: MessageState, { publicKeyArmored, fingerprint }: KeyInfoForFile) => {
    const name = `publickey - ${message.data?.Sender?.Address} - 0x${fingerprint.slice(0, 8).toUpperCase()}.asc`;
    return new File([publicKeyArmored], name, { type: 'application/pgp-keys' });
};

/**
 * Attaches the senders public key to the message
 */
export const attachPublicKey = async (message: MessageStateWithData, messageKeys: PublicPrivateKey, uid: string) => {
    const attachments = message.data?.Attachments || [];

    // we always attach the v4 key, since the v6-PQC one is not standardized (TODO update logic to attach the v6 key if it's standardized)
    const privateKey = messageKeys.signingKeys[0];
    const info = {
        fingerprint: privateKey.getFingerprint(),
        publicKeyArmored: await CryptoProxy.exportPublicKey({ key: privateKey }),
    };
    const file = fileFromKeyInfo(message, info);
    const attachmentExists = attachments.some((attachment) => blobEqualsAttachment(file, attachment));

    if (attachmentExists) {
        return undefined;
    }

    const [uploadInfo] = upload([file], message, messageKeys, ATTACHMENT_DISPOSITION.ATTACHMENT, uid);
    const uploadResult = await uploadInfo.resultPromise;
    return uploadResult.attachment;
};
