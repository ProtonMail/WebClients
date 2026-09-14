import { type FC, useEffect, useState } from 'react';

import type { IconComponent } from '@proton/icons/component';
import { IcFile } from '@proton/icons/icons/IcFile';
import { IcFileImage } from '@proton/icons/icons/IcFileImage';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';
import { IcFilePdf } from '@proton/icons/icons/IcFilePdf';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcVideoCamera } from '@proton/icons/icons/IcVideoCamera';
import type { IconSize } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import PassUI from '../../lib/core/ui.proxy';

type Props = { mimeType: string; className?: string; size?: IconSize };

const getIconFromMimeType = async (mimeType: string): Promise<IconComponent> => {
    try {
        switch (await PassUI.file_group_from_mime_type(mimeType)) {
            case 'Image':
            case 'Photo':
            case 'VectorImage':
                return IcFileImage;
            case 'Key':
                return IcKey;
            case 'Pdf':
                return IcFilePdf;
            case 'Text':
            case 'Document':
            case 'Excel':
            case 'PowerPoint':
            case 'Word':
                return IcFileLines;
            case 'Video':
                return IcVideoCamera;
            default:
                return IcFile;
        }
    } catch {
        return IcFile;
    }
};

export const FileAttachmentIcon: FC<Props> = ({ mimeType, className, size }) => {
    /* The lazy initialiser and the `() => icon` setter matter: a component is a
     * function, so passing it directly would be read as a state updater. */
    const [Icon, setIcon] = useState<IconComponent>(() => IcFile);

    useEffect(() => {
        getIconFromMimeType(mimeType)
            .then((icon) => setIcon(() => icon))
            .catch(noop);
    }, [mimeType]);

    return <Icon className={clsx('m-auto', className)} size={size} />;
};
