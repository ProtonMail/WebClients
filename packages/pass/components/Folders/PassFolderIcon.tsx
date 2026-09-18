import type { FC } from 'react';

import { IcFolderFilled } from '@proton/icons/icons/IcFolderFilled';
import { IcFoldersFilled } from '@proton/icons/icons/IcFoldersFilled';
import type { IconSize } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

type Props = {
    /** Renders the stacked folders icon when the folder has subfolders */
    hasChildren?: boolean;
    size?: IconSize;
    className?: string;
    color?: string;
};

export const PassFolderIcon: FC<Props> = ({ hasChildren = false, size = 4, className, color = '#E9A944' }) => {
    const FolderIcon = hasChildren ? IcFoldersFilled : IcFolderFilled;
    return <FolderIcon size={size} className={clsx('shrink-0', className)} color={color} />;
};
