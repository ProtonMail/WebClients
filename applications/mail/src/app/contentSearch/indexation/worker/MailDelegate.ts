import { html_to_text_fast } from '@protontech/mail-html-to-text-fast-wasm';

import { type Document, Value } from '@proton/proton-foundation-search';
import type { AttachmentsMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import { ATTACHMENT_DISPOSITION } from '@proton/shared/lib/mail/constants';

import type { ESBaseMessage } from '../../../models/encryptedSearch';

/**
 * Separator between filenames in the `attachment` attribute (mail-specs search-indexing, "Attachment names").
 * Highlighting must walk filenames with running offsets instead of splitting on it, since a filename may contain it.
 */
const ATTACHMENT_NAME_SEPARATOR = ', ';

/**
 * MIME types of the listable categories (audio, Excel, image, PDF, PowerPoint, video, Word), matched exactly.
 * Mirrors `MimeTypeCategory` in mail-common `datatypes/attachment/mime_type.rs` so that web and native
 * index byte-identical values.
 */
const LISTABLE_ATTACHMENT_MIME_TYPES = new Set<string>([
    // audio
    'application/ogg',
    'application/x-cdf',
    'audio/aac',
    'audio/aiff',
    'audio/midi',
    'audio/mpeg',
    'audio/mpeg3',
    'audio/ogg',
    'audio/x-hx-aac-adts',
    'audio/x-m4a',
    'audio/x-midi',
    'audio/x-mpeg-3',
    'audio/x-realaudio',
    'audio/x-wav',
    // excel
    'application/excel',
    'application/vnd.ms-excel',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/x-excel',
    'application/x-msexcel',
    // image
    'application/postscript',
    'application/vnd.visio',
    'image/gif',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/svg+xml',
    'image/tiff',
    'image/vnd.wap.wbmp',
    'image/webp',
    'image/x-icon',
    'image/x-jng',
    'image/x-ms-bmp',
    'video/x-mng',
    // pdf
    'application/pdf',
    // powerpoint
    'application/mspowerpoint',
    'application/powerpoint',
    'application/vnd.ms-powerpoint',
    'application/vnd.oasis.opendocument.presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/x-mspowerpoint',
    'text/x-pot',
    // video
    'application/vnd.apple.mpegurl',
    'application/vnd.wap.wmlc',
    'image/mov',
    'video/3gpp',
    'video/avi',
    'video/mp2t',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
    'video/x-flv',
    'video/x-m4v',
    'video/x-matroska',
    'video/x-ms-asf',
    'video/x-ms-wmv',
    'video/x-msvideo',
    'video/x-quicktime',
    // word
    'application/doc',
    'application/ms-doc',
    'application/msword',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/x-abiword',
]);

const isListableAttachment = (attachment: AttachmentsMetadata) => {
    return (
        attachment.Disposition === ATTACHMENT_DISPOSITION.ATTACHMENT &&
        LISTABLE_ATTACHMENT_MIME_TYPES.has(attachment.MIMEType)
    );
};

/**
 * Builds the value of the `attachment` attribute: the unmodified filenames of the listable attachments,
 * in the order received, joined with `ATTACHMENT_NAME_SEPARATOR`. Empty string when there are none.
 */
export const getIndexedAttachmentNames = (attachmentsMetadata: AttachmentsMetadata[] | undefined) => {
    if (!attachmentsMetadata) {
        return '';
    }

    return attachmentsMetadata
        .filter(isListableAttachment)
        .map((attachment) => {
            return attachment.Name;
        })
        .join(ATTACHMENT_NAME_SEPARATOR);
};

export class MailDelegate {
    stageMetadata(metadata: ESBaseMessage, doc: Document) {
        doc.addAttribute('subject', Value.text(metadata.Subject));
        doc.addAttribute('time', Value.int(BigInt(metadata.Time)));
        doc.addAttribute('hasAttachments', Value.bool(metadata.NumAttachments > 0));
        doc.addAttribute('attachment', Value.text(getIndexedAttachmentNames(metadata.AttachmentsMetadata)));
        doc.addAttribute('sender', Value.tag(metadata.Sender.Address));
        for (const to of metadata.ToList) {
            doc.addAttribute('recipient', Value.tag(to.Address));
        }
        for (const cc of metadata.CCList) {
            doc.addAttribute('recipient', Value.tag(cc.Address));
        }
        for (const label of metadata.LabelIDs) {
            doc.addAttribute('labelId', Value.tag(label));
        }
        doc.addAttribute('addressId', Value.tag(metadata.AddressID));

        doc.addRangeKey(BigInt(metadata.Time));
    }

    stageBody(body: string, doc: Document) {
        const strippedBody = html_to_text_fast(body);
        doc.addAttribute('body', Value.text(strippedBody));
    }
}
