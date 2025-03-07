import type { MIMEAttachment } from '@proton/crypto';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { ATTACHMENT_DISPOSITION, MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { ENCRYPTED_STATUS } from '../../constants';
import type { DecryptedAttachment } from '../../store/attachments/attachmentsTypes';

// This prefix is really useful to distinguish 'real' attachments from pgp attachments.
export const ID_PREFIX = 'PGPAttachment';

export const getId = (message: Message, parsedAttachment: MIMEAttachment, number: number) =>
    `${ID_PREFIX}_${message.ID}_${parsedAttachment.contentId}_${number}`;

/**
 * Unfortunately mailparser doesn't expose header data directly so we will reconstruct the headers
 */
export const getHeaders = ({
    fileName,
    contentDisposition = '',
    contentType = '',
    headers: originalHeaders,
}: MIMEAttachment) => {
    const headers: { [key: string]: any } = {};
    const filenameOption = `; filename=${JSON.stringify(fileName)}`; // filename could have been generated, hence be missing from original headers
    headers['content-disposition'] = contentDisposition + filenameOption;
    // test if this is an assigned content id
    if (originalHeaders['content-id'] && originalHeaders['content-id'].length > 0) {
        headers['content-id'] = originalHeaders['content-id'][0];
    }
    if (contentDisposition.toLowerCase() === ATTACHMENT_DISPOSITION.INLINE) {
        headers.embedded = 1;
    }
    headers['content-type'] = contentType + filenameOption;
    return headers;
};

/**
 * Convert a single attachment
 */
export const convertSingle = (
    message: Message,
    parsedAttachment: MIMEAttachment,
    number: number,
    onUpdateAttachment: (ID: string, attachment: DecryptedAttachment) => void
): Attachment => {
    const ID = getId(message, parsedAttachment, number);

    const attachment: Attachment = {
        ID,
        Headers: getHeaders(parsedAttachment),
        Name: parsedAttachment.fileName,
        KeyPackets: null, // already decrypted;
        MIMEType: parsedAttachment.contentType,
        Size: parsedAttachment.size,
        Encrypted: ENCRYPTED_STATUS.PGP_MIME,
    };

    const attachmentData: DecryptedAttachment = {
        data: parsedAttachment.content,
        filename: '',
        signatures: [],
        verificationStatus: MAIL_VERIFICATION_STATUS.NOT_SIGNED,
    };

    onUpdateAttachment(ID, attachmentData);
    // invalidSignature.askAgain(message, attachment, false);
    return attachment;
};

/**
 * Converts the parsedAttachment coming from mailparser to an attachment linked to the message provided.
 */
export const convert = (
    message: Message,
    attachments: MIMEAttachment[],
    onUpdateAttachment: (ID: string, attachment: DecryptedAttachment) => void
): Attachment[] => {
    return attachments.map((attachment, number) => convertSingle(message, attachment, number, onUpdateAttachment));
};

/**
 * Considering a Attachment[], will return as is the common attachments
 * But remove from the list and convert the pgp ones by files to upload
 */
export const convertToFile = (
    attachments: Attachment[],
    getAttachment: (ID: string) => DecryptedAttachment | undefined
) => {
    return attachments.reduce<[Attachment[], File[]]>(
        (acc, attachment) => {
            if (attachment.ID?.startsWith(ID_PREFIX)) {
                const attachmentData = getAttachment(attachment.ID as string)?.data;
                if (attachmentData) {
                    acc[1].push(new File([attachmentData], attachment.Name || '', { type: attachment.MIMEType }));
                }
            } else {
                acc[0].push(attachment);
            }
            return acc;
        },
        [[], []]
    );
};
