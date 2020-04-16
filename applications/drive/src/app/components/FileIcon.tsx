import React from 'react';
import { isSupportedImage, isPDF, isSupportedText } from './FilePreview/FilePreview';
import { MimeIcon } from 'react-components';

interface Props {
    mimeType: string;
}

const FileIcon = ({ mimeType }: Props) => {
    let name = mimeType === 'Folder' ? 'folder' : 'default';

    if (isSupportedImage(mimeType)) {
        name = 'image';
    }

    if (isPDF(mimeType)) {
        name = 'portable';
    }

    if (isSupportedText(mimeType)) {
        name = 'text';
    }

    return <MimeIcon name={name} className="flex-item-noshrink mr0-5" />;
};

export default FileIcon;
