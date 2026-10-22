import {
    PROTON_DOCS_DOCUMENT_MIMETYPE,
    PROTON_DOCS_SPREADSHEET_MIMETYPE,
    isAudio,
    isExcel,
    isFont,
    isICS,
    isImage,
    isPDF,
    isProtonDocsDocument,
    isProtonDocsSpreadsheet,
    isSupportedText,
    isVideo,
} from '@proton/shared/lib/helpers/mimetype';

import type { MimeIconComponent } from './component';
import { MimeAlbum } from './icons/MimeAlbum';
import { MimeAttachments } from './icons/MimeAttachments';
import { MimeCalendar } from './icons/MimeCalendar';
import { MimeDoc } from './icons/MimeDoc';
import { MimeFolder } from './icons/MimeFolder';
import { MimeFont } from './icons/MimeFont';
import { MimeImage } from './icons/MimeImage';
import { MimeKeynote } from './icons/MimeKeynote';
import { MimeKeytrust } from './icons/MimeKeytrust';
import { MimeNumbers } from './icons/MimeNumbers';
import { MimePages } from './icons/MimePages';
import { MimePdf } from './icons/MimePdf';
import { MimePpt } from './icons/MimePpt';
import { MimeProtonDoc } from './icons/MimeProtonDoc';
import { MimeProtonSheet } from './icons/MimeProtonSheet';
import { MimeSound } from './icons/MimeSound';
import { MimeText } from './icons/MimeText';
import { MimeUnknown } from './icons/MimeUnknown';
import { MimeVideo } from './icons/MimeVideo';
import { MimeXls } from './icons/MimeXls';
import { MimeXml } from './icons/MimeXml';
import { MimeZip } from './icons/MimeZip';

/** The file icons, by their name in `assets/file-icons.svg`. */
export type FileIconName =
    | 'album'
    | 'attachments'
    | 'calendar'
    | 'doc'
    | 'folder'
    | 'font'
    | 'image'
    | 'keynote'
    | 'keytrust'
    | 'numbers'
    | 'pages'
    | 'pdf'
    | 'ppt'
    | 'sound'
    | 'text'
    | 'unknown'
    | 'video'
    | 'xls'
    | 'xml'
    | 'zip'
    | 'proton-doc'
    | 'proton-sheet';

const iconsMap: { [mimeType: string]: FileIconName } = {
    Folder: 'folder',
    Album: 'album',

    'application/octet-stream': 'unknown', // Default mimetype when the real one cannot be detected.

    'application/x-rar-compressed': 'zip',
    'application/x-zip-compressed': 'zip',
    'application/zip': 'zip',
    'application/x-7z-compressed': 'zip', // .7z — 7-Zip compressed file
    'application/x-arj': 'zip', // .arj — ARJ compressed file
    'application/x-debian-package': 'zip', // .deb — Debian software package file
    'application/x-redhat-package-manager': 'zip', // .rpm
    'application/x-rpm': 'zip', // .rpm
    'application/vnd.rar': 'zip', // .rar – RAR file
    'application/gzip': 'zip', // .tar.gz — Tarball compressed file
    'application/x-gzip': 'zip', // .tar.gz — Tarball compressed file
    'application/x-compress': 'zip', // .z — Z compressed file
    'application/vnd.apple.installer+xml': 'zip', // .pkg

    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',

    [PROTON_DOCS_DOCUMENT_MIMETYPE]: 'proton-doc',
    [PROTON_DOCS_SPREADSHEET_MIMETYPE]: 'proton-sheet',

    'application/vnd.ms-powerpoint': 'ppt', // .ppt/.pps
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',

    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xls', // .xlsm - Microsoft Excel file
    'application/vnd.oasis.opendocument.spreadsheet': 'xls', // .ods — OpenOffice Calc spreadsheet file
    'application/vnd.oasis.opendocument.presentation': 'ppt', // .ods — OpenOffice Calc presentation file

    'application/xliff+xml': 'xml',
    'application/xml': 'xml',
    'text/html': 'xml', // .html/.htm
    'application/xhtml+xml': 'xml', // .xhtml

    'application/pgp-keys': 'keytrust',

    'application/rtf': 'text',
    'application/x-tex': 'text',
    'application/vnd.oasis.opendocument.text': 'text',
    'application/vnd.wordperfect': 'text',

    'application/vnd.ms-fontobject': 'font',
    'application/font-sfnt': 'font', // ttf
    'application/vnd.oasis.opendocument.formula-template': 'font', // otf

    'application/vnd.apple.pages': 'pages',
    'application/vnd.apple.numbers': 'numbers',
    'application/vnd.apple.keynote': 'keynote',
};

/**
 * The name of the file icon for a mime type. `FileIcon` renders it from the sprite through `MimeIcon` until it moves
 * to the inline components.
 */
export const getFileIconName = (mimeType: string): FileIconName => {
    let name: FileIconName = 'unknown';

    if (iconsMap[mimeType]) {
        name = iconsMap[mimeType];
    } else if (isImage(mimeType)) {
        name = 'image';
    } else if (mimeType === 'text/xml') {
        // Exception for XML to use it's own icon and not fallback as text
        name = 'xml';
    } else if (isICS(mimeType)) {
        name = 'calendar';
    } else if (isSupportedText(mimeType)) {
        name = 'text';
    } else if (isPDF(mimeType)) {
        name = 'pdf';
    } else if (isVideo(mimeType)) {
        name = 'video';
    } else if (isAudio(mimeType)) {
        name = 'sound';
    } else if (isFont(mimeType)) {
        name = 'font';
    } else if (isExcel(mimeType)) {
        name = 'xls';
    } else if (isProtonDocsDocument(mimeType)) {
        name = 'proton-doc';
    } else if (isProtonDocsSpreadsheet(mimeType)) {
        name = 'proton-sheet';
    }

    return name;
};

const FILE_ICONS: Record<FileIconName, MimeIconComponent> = {
    album: MimeAlbum,
    attachments: MimeAttachments,
    calendar: MimeCalendar,
    doc: MimeDoc,
    folder: MimeFolder,
    font: MimeFont,
    image: MimeImage,
    keynote: MimeKeynote,
    keytrust: MimeKeytrust,
    numbers: MimeNumbers,
    pages: MimePages,
    pdf: MimePdf,
    ppt: MimePpt,
    sound: MimeSound,
    text: MimeText,
    unknown: MimeUnknown,
    video: MimeVideo,
    xls: MimeXls,
    xml: MimeXml,
    zip: MimeZip,
    'proton-doc': MimeProtonDoc,
    'proton-sheet': MimeProtonSheet,
};

/** The inline `Mime*` component for a mime type. Unlike `FileIcon`, it does not add `shrink-0`. */
export const getFileIcon = (mimeType: string): MimeIconComponent => FILE_ICONS[getFileIconName(mimeType)];
