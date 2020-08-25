import JSZip from 'jszip';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import { Api } from 'proton-shared/lib/interfaces';
import { VERIFICATION_STATUS } from '../../constants';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { Attachment } from '../../models/attachment';

import { Message, MessageExtended, MessageExtendedWithData } from '../../models/message';
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
    message: MessageExtended,
    cache: AttachmentsCache,
    api: Api
): Promise<Download> => {
    try {
        const reverify = !!(message.senderVerified && message.senderPinnedKeys?.length);
        const { data, verified } = await getAndVerify(attachment, message, reverify, cache, api);
        return {
            attachment,
            data: data as Uint8Array,
            verified
        };
    } catch (error) {
        // If the decryption fails we download the encrypted version
        if (error.data) {
            return {
                attachment: {
                    Name: `${attachment.Name}.pgp`,
                    MIMEType: 'application/pgp',
                    ID: attachment.ID
                },
                data: error.binary,
                isError: true,
                verified: VERIFICATION_STATUS.NOT_VERIFIED
            };
        }
        throw error;
    }
};

/**
 * Generate a download for an attachment
 */
export const generateDownload = async (download: Download /*, message: MessageExtended*/) => {
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
    message: MessageExtended,
    cache: AttachmentsCache,
    api: Api
): Promise<Download[]> => {
    const { Attachments = [] } = message.data || {};
    const { list }: { list: Attachment[] } = Attachments.reduce(
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

    return Promise.all(list.map((att) => formatDownload(att, message, cache, api)));
};

const getZipAttachmentName = (message: Message) => `Attachments-${message.Subject}.zip`;

/**
 * Zip and trigger download of a list of download objects
 */
export const generateDownloadAll = async (message: MessageExtendedWithData, list: Download[]) => {
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
    const name = getZipAttachmentName(message.data);

    downloadFile(content, name);
};
