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

const iconsMap: { [mimeType: string]: MimeIconComponent } = {
    Folder: MimeFolder,
    Album: MimeAlbum,

    'application/octet-stream': MimeUnknown, // Default mimetype when the real one cannot be detected.

    'application/x-rar-compressed': MimeZip,
    'application/x-zip-compressed': MimeZip,
    'application/zip': MimeZip,
    'application/x-7z-compressed': MimeZip, // .7z — 7-Zip compressed file
    'application/x-arj': MimeZip, // .arj — ARJ compressed file
    'application/x-debian-package': MimeZip, // .deb — Debian software package file
    'application/x-redhat-package-manager': MimeZip, // .rpm
    'application/x-rpm': MimeZip, // .rpm
    'application/vnd.rar': MimeZip, // .rar – RAR file
    'application/gzip': MimeZip, // .tar.gz — Tarball compressed file
    'application/x-gzip': MimeZip, // .tar.gz — Tarball compressed file
    'application/x-compress': MimeZip, // .z — Z compressed file
    'application/vnd.apple.installer+xml': MimeZip, // .pkg

    'application/msword': MimeDoc,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': MimeDoc,

    [PROTON_DOCS_DOCUMENT_MIMETYPE]: MimeProtonDoc,
    [PROTON_DOCS_SPREADSHEET_MIMETYPE]: MimeProtonSheet,

    'application/vnd.ms-powerpoint': MimePpt, // .ppt/.pps
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': MimePpt,

    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': MimeXls, // .xlsm - Microsoft Excel file
    'application/vnd.oasis.opendocument.spreadsheet': MimeXls, // .ods — OpenOffice Calc spreadsheet file
    'application/vnd.oasis.opendocument.presentation': MimePpt, // .ods — OpenOffice Calc presentation file

    'application/xliff+xml': MimeXml,
    'application/xml': MimeXml,
    'text/html': MimeXml, // .html/.htm
    'application/xhtml+xml': MimeXml, // .xhtml

    'application/pgp-keys': MimeKeytrust,

    'application/rtf': MimeText,
    'application/x-tex': MimeText,
    'application/vnd.oasis.opendocument.text': MimeText,
    'application/vnd.wordperfect': MimeText,

    'application/vnd.ms-fontobject': MimeFont,
    'application/font-sfnt': MimeFont, // ttf
    'application/vnd.oasis.opendocument.formula-template': MimeFont, // otf

    'application/vnd.apple.pages': MimePages,
    'application/vnd.apple.numbers': MimeNumbers,
    'application/vnd.apple.keynote': MimeKeynote,
};

/** The inline `Mime*` component for a mime type. Callers in a flex row usually want to pass `shrink-0`. */
export const getFileIcon = (mimeType: string): MimeIconComponent => {
    let Icon: MimeIconComponent = MimeUnknown;

    if (iconsMap[mimeType]) {
        Icon = iconsMap[mimeType];
    } else if (isImage(mimeType)) {
        Icon = MimeImage;
    } else if (mimeType === 'text/xml') {
        // Exception for XML to use it's own icon and not fallback as text
        Icon = MimeXml;
    } else if (isICS(mimeType)) {
        Icon = MimeCalendar;
    } else if (isSupportedText(mimeType)) {
        Icon = MimeText;
    } else if (isPDF(mimeType)) {
        Icon = MimePdf;
    } else if (isVideo(mimeType)) {
        Icon = MimeVideo;
    } else if (isAudio(mimeType)) {
        Icon = MimeSound;
    } else if (isFont(mimeType)) {
        Icon = MimeFont;
    } else if (isExcel(mimeType)) {
        Icon = MimeXls;
    } else if (isProtonDocsDocument(mimeType)) {
        Icon = MimeProtonDoc;
    } else if (isProtonDocsSpreadsheet(mimeType)) {
        Icon = MimeProtonSheet;
    }

    return Icon;
};
