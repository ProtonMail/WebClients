import JSZip from 'jszip';

import type { MessageKeys, MessageVerification } from '@proton/mail/store/messages/messagesTypes';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { splitExtension } from '@proton/shared/lib/helpers/file';
import type { Api } from '@proton/shared/lib/interfaces';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import type { DecryptedAttachment } from '../../store/attachments/attachmentsTypes';
import { getAndVerifyAttachment } from './attachmentLoader';

export interface Download {
    attachment: Attachment;
    data: Uint8Array<ArrayBuffer>;
    isError?: boolean;
    verificationStatus: MAIL_VERIFICATION_STATUS;
}

/**
 * Format attachment for the download
 */
export const formatDownload = async (
    attachment: Attachment,
    verification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    onUpdateAttachment: (ID: string, attachment: DecryptedAttachment) => void,
    api: Api,
    getAttachment?: (ID: string) => DecryptedAttachment | undefined,
    messageFlags?: number
): Promise<Download> => {
    try {
        const { data, verificationStatus } = await getAndVerifyAttachment(
            attachment,
            verification,
            messageKeys,
            api,
            getAttachment,
            onUpdateAttachment,
            messageFlags
        );
        return {
            attachment,
            data: data as Uint8Array<ArrayBuffer>,
            verificationStatus,
        };
    } catch (error: any) {
        // If the decryption fails we download the encrypted version
        if (error.data) {
            return {
                attachment: {
                    Name: `${attachment.Name}.pgp`,
                    MIMEType: 'application/pgp-encrypted',
                    ID: attachment.ID,
                },
                data: error.binary,
                isError: true,
                verificationStatus: MAIL_VERIFICATION_STATUS.NOT_VERIFIED,
            };
        }
        throw error;
    }
};

/**
 * Generate a download for an attachment
 */
export const generateDownload = async (download: Download /* , message: MessageExtended */) => {
    let mimeType = download.attachment.MIMEType;

    // Since version 98, PDF are opened instead of being downloaded in Firefox
    // One workaround is to use the type application/octet-stream
    if (isFirefox()) {
        mimeType = 'application/octet-stream';
    }

    downloadFile(new Blob([download.data], { type: mimeType }), download.attachment.Name);
};

/**
 * The attachment's Name is not unique we need a unique name in order to make the zip.
 * The lib doesn't allow duplicates
 */
export const formatDownloadAll = async (
    attachments: Attachment[],
    verification: MessageVerification | undefined,
    messageKeys: MessageKeys,
    onUpdateAttachment: (ID: string, attachment: DecryptedAttachment) => void,
    api: Api,
    getAttachment?: (ID: string) => DecryptedAttachment | undefined,
    messageFlags?: number
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
                const updatedAttachment = { ...att, Name: newName };
                acc.list.push(updatedAttachment);
                return acc;
            }
            acc.list.push(att);
            return acc;
        },
        { list: [], map: {} }
    );

    return Promise.all(
        list.map((att) =>
            formatDownload(att, verification, messageKeys, onUpdateAttachment, api, getAttachment, messageFlags)
        )
    );
};

export const getZipAttachmentName = (message: Pick<Message, 'Subject'>) => `Attachments-${message.Subject}.zip`;

/**
 * Zip and trigger download of a list of download objects
 */
export const generateDownloadAll = async (message: Pick<Message, 'Subject'>, list: Download[]) => {
    const zip = new JSZip();
    list.forEach(({ attachment: { Name = '' }, data }) => zip.file(Name, data));
    const content = await zip.generateAsync({ type: 'blob' });
    const name = getZipAttachmentName(message);

    downloadFile(content, name);
};
