import { type FC, useMemo } from 'react';

import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import PassCoreUI from '@proton/pass/lib/core/core.ui';
import clsx from '@proton/utils/clsx';

type Props = { mimeType: string; className?: string };

export const FileAttachmentIcon: FC<Props> = ({ mimeType, className }) => {
    const icon = useMemo((): IconName => {
        try {
            switch (PassCoreUI.file_group_from_mime_type(mimeType)) {
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
    }, [mimeType]);

    return <Icon name={icon} className={clsx('m-auto', className)} />;
};
