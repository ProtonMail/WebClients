import { isImage, isSupportedText, isPDF, isICS, isVideo, isFont } from '../../containers/filePreview/helpers';
import { IconProps } from '../icon/Icon';
import MimeIcon from '../icon/MimeIcon';

const iconsMap: { [mimeType: string]: { name: string } } = {
    Folder: { name: 'folder' },

    'application/x-rar-compressed': { name: 'zip' },
    'application/x-zip-compressed': { name: 'zip' },
    'application/zip': { name: 'zip' },
    'application/x-7z-compressed': { name: 'zip' }, // .7z — 7-Zip compressed file
    'application/arj': { name: 'zip' }, // .arj — ARJ compressed file
    'application/x-debian-package': { name: 'zip' }, // .deb — Debian software package file
    'application/octet-stream': { name: 'zip' }, // .pkg/.rpm
    'application/vnd.rar': { name: 'zip' }, // .rar – RAR file
    'application/gzip': { name: 'zip' }, // .tar.gz — Tarball compressed file
    'application/x-compress': { name: 'zip' }, // .z — Z compressed file

    'application/msword': { name: 'doc' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        name: 'doc',
    },

    'application/vnd.ms-powerpoint': { name: 'ppt' }, // .ppt/.pps
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
        name: 'ppt',
    },

    'application/vnd.ms-excel': { name: 'xls' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { name: 'xls' }, // .xlsm - Microsoft Excel file
    'application/vnd.oasis.opendocument.spreadsheet': { name: 'xls' }, // .ods — OpenOffice Calc spreadsheet file

    'application/xliff+xml': { name: 'xml' },
    'application/xml': { name: 'xml' },
    'application/pgp-keys': { name: 'keytrust' },

    'application/rtf': { name: 'text' },
    'application/x-tex': { name: 'text' },
    'application/vnd.oasis.opendocument.text': { name: 'text' },
    'application/vnd.wordperfect': { name: 'text' },
};

const getIconName = (mimeType: string) => {
    let name = 'unknown';

    if (isImage(mimeType)) {
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
    } else if (isFont(mimeType)) {
        name = 'font';
    } else if (iconsMap[mimeType]) {
        name = iconsMap[mimeType].name;
    }

    return name;
};

interface Props extends Omit<IconProps, 'name'> {
    mimeType: string;
}

/**
 * Component to render SVG file icons.
 * It's wrapper around MimeIcon component which finds the proper icon
 * name based on the mime type.
 */
const FileIcon = ({ mimeType, ...rest }: Props) => {
    const name = getIconName(mimeType);

    return <MimeIcon name={name} className="flex-item-noshrink mr0-5" {...rest} />;
};

export default FileIcon;
