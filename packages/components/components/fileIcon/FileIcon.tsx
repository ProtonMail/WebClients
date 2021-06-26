import React from 'react';
import { isSupportedImage, isSupportedText, isPDF, isVideo } from '../../containers/filePreview/helpers';
import { Props as IconProps } from '../icon/Icon';
import MimeIcon from '../icon/MimeIcon';

const iconsMap: { [mimeType: string]: { name: string } } = {
    Folder: { name: 'folder' },
    'application/msword': { name: 'doc' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        name: 'doc',
    },
    'application/vnd.ms-powerpoint': { name: 'ppt' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
        name: 'ppt',
    },
    'application/x-rar-compressed': { name: 'zip' },
    'application/zip': { name: 'zip' },
    'application/vnd.ms-excel': { name: 'xls' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        name: 'xls',
    },
    'application/xliff+xml': { name: 'xml' },
    'application/xml': { name: 'xml' },
};

const getIconName = (mimeType: string) => {
    let name = 'unknown';

    if (isSupportedImage(mimeType)) {
        name = 'image';
    } else if (mimeType === 'text/xml') {
        // Exception for XML to use it's own icon and not fallback as text
        name = 'xml';
    } else if (isSupportedText(mimeType)) {
        name = 'text';
    } else if (isPDF(mimeType)) {
        name = 'pdf';
    } else if (isVideo(mimeType)) {
        name = 'video';
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
