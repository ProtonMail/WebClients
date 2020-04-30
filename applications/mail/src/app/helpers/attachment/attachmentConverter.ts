import { DecryptResultPmcrypto, VERIFICATION_STATUS } from 'pmcrypto';
import { ENCRYPTED_STATUS } from '../../constants';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { Attachment, AttachmentMime } from '../../models/attachment';
import { Message } from '../../models/message';

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
    contentType = ''
}: AttachmentMime) => {
    const headers: { [key: string]: any } = {};
    const filenameOption = '; filename=' + JSON.stringify(generatedFileName);
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
    cache: AttachmentsCache
): Attachment => {
    const ID = getId(message, parsedAttachment, number);

    const attachment: Attachment = {
        ID,
        Headers: getHeaders(parsedAttachment),
        Name: parsedAttachment.generatedFileName,
        KeyPackets: null, // already decrypted;
        MIMEType: parsedAttachment.contentType,
        Signature: null,
        Size: parsedAttachment.length,
        Encrypted: ENCRYPTED_STATUS.PGP_MIME
    };

    const attachmentData: DecryptResultPmcrypto = {
        data: parsedAttachment.content,
        filename: '',
        signatures: [],
        verified: VERIFICATION_STATUS.NOT_SIGNED
    };

    cache.set(ID, attachmentData /*, verified*/);
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
    cache: AttachmentsCache
): Attachment[] => {
    return attachments.map((attachment, number) => convertSingle(message, attachment, number, verified, cache));
};
