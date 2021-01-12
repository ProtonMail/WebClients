import JSZip from 'jszip';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import { Api } from 'proton-shared/lib/interfaces';
import { Attachment, Message } from 'proton-shared/lib/interfaces/mail/Message';
import { VERIFICATION_STATUS } from 'proton-shared/lib/mail/constants';
import { AttachmentsCache } from '../../containers/AttachmentProvider';

import { MessageKeys, MessageVerification } from '../../models/message';
import { getAndVerify } from './attachmentLoader';

export interface Download {
    attachment: Attachment;
    data: Uint8Array;
    isError?: boolean;
    verified: VERIFICATION_STATUS;
}

/**
 * Format attachment for the download
 */
export const formatDownload = async (
    attachment: Attachment,
    verification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    cache: AttachmentsCache,
    api: Api
): Promise<Download> => {
    try {
        const reverify = !!(verification?.senderVerified && verification.senderPinnedKeys?.length);
        const { data, verified } = await getAndVerify(attachment, verification, messageKeys, reverify, cache, api);
        return {
            attachment,
            data: data as Uint8Array,
            // Only care about signature verification for verified senders with pinned keys
            verified: reverify ? verified : VERIFICATION_STATUS.NOT_VERIFIED,
        };
    } catch (error) {
        // If the decryption fails we download the encrypted version
        if (error.data) {
            return {
                attachment: {
                    Name: `${attachment.Name}.pgp`,
                    MIMEType: 'application/pgp',
                    ID: attachment.ID,
                },
                data: error.binary,
                isError: true,
                verified: VERIFICATION_STATUS.NOT_VERIFIED,
            };
        }
        throw error;
    }
};

/**
 * Generate a download for an attachment
 */
export const generateDownload = async (download: Download /* , message: MessageExtended */) => {
    // TODO: uncomment
    // try {
    //     await checkAllSignatures(message, [attachment]);
    // } catch (e) {
    //     // swallow as the user is informed already by a confirmation and actually caused this error
    //     return;
    // }

    downloadFile(new Blob([download.data], { type: download.attachment.MIMEType }), download.attachment.Name);
};

/**
 * The attachment's Name is not unique we need a unique name in order to make the zip.
 * The lib doesn't allow duplicates
 */
export const formatDownloadAll = async (
    attachments: Attachment[],
    verification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    cache: AttachmentsCache,
    api: Api
): Promise<Download[]> => {
    const { list }: { list: Attachment[] } = attachments.reduce(
        (acc: any, att) => {
            const name = att.Name || '';
            if (!acc.map[name]) {
                acc.map[name] = { index: 0 };
            } else {
                acc.map[name].index++;
                const [fileName, ext] = splitExtension(name);
                const newName = `${fileName} (${acc.map[name].index}).${ext}`;
                att.Name = newName;
            }
            acc.list.push(att);
            return acc;
        },
        { list: [], map: {} }
    );

    return Promise.all(list.map((att) => formatDownload(att, verification, messageKeys, cache, api)));
};

const getZipAttachmentName = (message: Message) => `Attachments-${message.Subject}.zip`;

/**
 * Zip and trigger download of a list of download objects
 */
export const generateDownloadAll = async (message: Message, list: Download[]) => {
    // TODO: uncomment
    // try {
    //     await checkAllSignatures(message, list);
    // } catch (e) {
    //     // swallow as the user is informed already by a confirmation and actually caused this error
    //     return;
    // }

    const zip = new JSZip();
    list.forEach(({ attachment: { Name = '' }, data }) => zip.file(Name, data));
    const content = await zip.generateAsync({ type: 'blob' });
    const name = getZipAttachmentName(message);

    downloadFile(content, name);
};
