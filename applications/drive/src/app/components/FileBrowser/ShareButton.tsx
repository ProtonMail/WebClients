import React from 'react';
import { PrimaryButton, useModals, classnames } from '@proton/components';
import { c } from 'ttag';

import SharingModal from '../SharingModal/SharingModal';
import { FileBrowserItem } from './interfaces';
import { LinkType } from '../../interfaces/link';

interface Props {
    shareId: string;
    item: FileBrowserItem;
    className?: string;
}

export const shouldRenderShareButton = (item: FileBrowserItem) =>
    item.Type === LinkType.FILE && item.Trashed === null && !item.SharedUrl;

const ShareButton = ({ shareId, item, className }: Props) => {
    const { createModal } = useModals();
    const btnClassName = classnames(['flex', 'flex-item-noshrink', className]);

    return (
        <PrimaryButton
            className={btnClassName}
            size="small"
            onClick={(e) => {
                e.stopPropagation();
                createModal(<SharingModal shareId={shareId} item={item} />);
            }}
        >
            {c('Action').t`Share`}
        </PrimaryButton>
    );
};

export default ShareButton;
