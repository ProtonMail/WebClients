import type { Download } from '@proton/mail-message/helpers/attachment/attachmentDownloader';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import type { DriveFile } from './saveToDrive';

export type PreparedDriveFile = { status: 'ready' | 'senderNotVerified'; file: DriveFile } | { status: 'cannotSave' };

/**
 * Sorts a download the way download does: an attachment that couldn't be decrypted carries only its encrypted
 * bytes under a renamed `.pgp` attachment, so it's never handed on. A failed sender check keeps the decrypted
 * contents, so they can be saved once the person confirms.
 */
export const getDriveFileFromDownload = (download: Download): PreparedDriveFile => {
    if (download.isError) {
        return { status: 'cannotSave' };
    }

    const file: DriveFile = {
        data: download.data,
        name: download.attachment.Name ?? '',
        mediaType: download.attachment.MIMEType || 'application/octet-stream',
        // The decrypted byte count: Drive checks the upload against it, and the attachment's Size isn't always it.
        size: download.data.byteLength,
    };
    const senderNotVerified = download.verificationStatus === MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID;

    return { status: senderNotVerified ? 'senderNotVerified' : 'ready', file };
};
