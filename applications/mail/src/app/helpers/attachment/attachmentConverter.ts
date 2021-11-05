import { DecryptResultPmcrypto, VERIFICATION_STATUS } from 'pmcrypto';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { ENCRYPTED_STATUS } from '../../constants';
import { AttachmentMime } from '../../models/attachment';

// This prefix is really useful to distinguish 'real' attachments from pgp attachments.
const ID_PREFIX = 'PGPAttachment';

const getId = (message: Message, parsedAttachment: any, number: number) =>
    `${ID_PREFIX}_${message.ID}_${parsedAttachment.checksum}_${number}`;

/**
 * Unfortunately mailparser doesn't expose header data directly so we will reconstruct the headers
 */
const getHeaders = ({
    generatedFileName = '',
    contentDisposition = '',
    contentId = '',
    transferEncoding = '',
    contentType = '',
}: AttachmentMime) => {
    const headers: { [key: string]: any } = {};
    const filenameOption = `; filename=${JSON.stringify(generatedFileName)}`;
    headers['content-disposition'] = contentDisposition + filenameOption;
    // test if this is an assigned content id
    if (!/^.*@mailparser$/.test(contentId)) {
        headers['content-id'] = /^<.*>$/.test(contentId) ? contentId : `<${contentId}>`;
    }
    if (contentDisposition.toLowerCase() === 'inline') {
        headers.embedded = 1;
    }
    if (transferEncoding) {
        headers['content-transfer-encoding'] = transferEncoding;
    }
    headers['content-type'] = contentType + filenameOption;
    return headers;
};

/**
 * Convert a single attachment
 */
const convertSingle = (
    message: Message,
    parsedAttachment: AttachmentMime,
    number: number,
    verified: number,
    onUpdateAttachment: (ID: string, attachment: DecryptResultPmcrypto) => void
): Attachment => {
    const ID = getId(message, parsedAttachment, number);

    const attachment: Attachment = {
        ID,
        Headers: getHeaders(parsedAttachment),
        Name: parsedAttachment.generatedFileName,
        KeyPackets: null, // already decrypted;
        MIMEType: parsedAttachment.contentType,
        Size: parsedAttachment.length,
        Encrypted: ENCRYPTED_STATUS.PGP_MIME,
    };

    const attachmentData: DecryptResultPmcrypto = {
        data: parsedAttachment.content,
        filename: '',
        signatures: [],
        verified: VERIFICATION_STATUS.NOT_SIGNED,
    };

    onUpdateAttachment(ID, attachmentData /* , verified */);
    // invalidSignature.askAgain(message, attachment, false);
    return attachment;
};

/**
 * Converts the parsedAttachment coming from mailparser to an attachment linked to the message provided.
 */
export const convert = (
    message: Message,
    attachments: AttachmentMime[],
    verified: number,
    onUpdateAttachment: (ID: string, attachment: DecryptResultPmcrypto) => void
): Attachment[] => {
    return attachments.map((attachment, number) =>
        convertSingle(message, attachment, number, verified, onUpdateAttachment)
    );
};

/**
 * Considering a Attachment[], will return as is the common attachments
 * But remove from the list and convert the pgp ones by files to upload
 */
export const convertToFile = (
    attachments: Attachment[],
    getAttachment: (ID: string) => DecryptResultPmcrypto | undefined
) => {
    return attachments.reduce<[Attachment[], File[]]>(
        (acc, attachment) => {
            if (attachment.ID?.startsWith(ID_PREFIX)) {
                acc[1].push(
                    new File([getAttachment(attachment.ID as string)?.data], attachment.Name || '', {
                        type: attachment.MIMEType,
                    })
                );
            } else {
                acc[0].push(attachment);
            }
            return acc;
        },
        [[], []]
    );
};
