import React from 'react';
import { Icon, classnames } from 'react-components';
import { isSupportedImage, isVideo } from '../FilePreview/FilePreview';

const iconsMap: { [mimeType: string]: { name: string; colorClass?: string } } = {
    Folder: { name: 'folder' },
    'application/msword': { name: 'file-doc', colorClass: 'pd-icon-blue' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        name: 'file-docx',
        colorClass: 'pd-icon-blue'
    },
    'application/pdf': { name: 'file-pdf', colorClass: 'pd-icon-red' },
    'application/vnd.ms-powerpoint': { name: 'file-ppt', colorClass: 'pd-icon-orange' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
        name: 'file-pptx',
        colorClass: 'pd-icon-orange'
    },
    'application/x-rar-compressed': { name: 'file-rar-zip' },
    'application/zip': { name: 'file-rar-zip' },
    'application/vnd.ms-excel': { name: 'file-xls', colorClass: 'pd-icon-green' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        name: 'file-xslx',
        colorClass: 'pd-icon-green'
    },
    'application/x-xliff+xml': { name: 'file-xliff' },
    'application/xml': { name: 'file-xml' }
};

const getIconName = (mimeType: string) => {
    let name = 'file-unknown';

    if (isSupportedImage(mimeType)) {
        name = 'file-image';
    } else if (isVideo(mimeType)) {
        name = 'file-video';
    } else if (iconsMap[mimeType]) {
        name = iconsMap[mimeType].name;
    }

    return name;
};

interface Props {
    mimeType: string;
}

const FileIcon = ({ mimeType, ...rest }: Props) => {
    const name = getIconName(mimeType);
    const colorClass = iconsMap[mimeType]?.colorClass;

    return <Icon name={name} className={classnames(['flex-item-noshrink mr0-5', colorClass])} {...rest} />;
};

export default FileIcon;
