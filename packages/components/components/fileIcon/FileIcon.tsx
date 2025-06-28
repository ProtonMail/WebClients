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
import clsx from '@proton/utils/clsx';

import type { MimeIconProps, MimeName } from '../icon/MimeIcon';
import MimeIcon from '../icon/MimeIcon';

const iconsMap: { [mimeType: string]: MimeName } = {
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

const getIconName = (mimeType: string) => {
    let name: MimeName = 'unknown';

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

interface Props extends Omit<MimeIconProps, 'name'> {
    mimeType: string;
}

/**
 * Component to render SVG file icons.
 * It's wrapper around MimeIcon component which finds the proper icon
 * name based on the mime type.
 */
const FileIcon = ({ mimeType, className, ...rest }: Props) => {
    const name = getIconName(mimeType);

    return <MimeIcon name={name} className={clsx(['shrink-0', className])} {...rest} />;
};

export default FileIcon;
