import { type FC, useEffect, useState } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import type { IconName, IconSize } from '@proton/icons/types';
import PassUI from '@proton/pass/lib/core/ui.proxy';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

type Props = { mimeType: string; className?: string; size?: IconSize };

const getIconFromMimeType = async (mimeType: string): Promise<IconName> => {
    try {
        switch (await PassUI.file_group_from_mime_type(mimeType)) {
            case 'Image':
            case 'Photo':
            case 'VectorImage':
                return 'file-image';
            case 'Key':
                return 'key';
            case 'Pdf':
                return 'file-pdf';
            case 'Text':
            case 'Document':
            case 'Excel':
            case 'PowerPoint':
            case 'Word':
                return 'file-lines';
            case 'Video':
                return 'video-camera';
            default:
                return 'file';
        }
    } catch {
        return 'file';
    }
};

export const FileAttachmentIcon: FC<Props> = ({ mimeType, className, size }) => {
    const [icon, setIcon] = useState<IconName>('file');

    useEffect(() => {
        getIconFromMimeType(mimeType).then(setIcon).catch(noop);
    }, [mimeType]);

    return <Icon name={icon} className={clsx('m-auto', className)} size={size} />;
};
