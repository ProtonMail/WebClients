import React from 'react';
import { PrimaryButton, useModals, classnames } from '@proton/components';
import { c } from 'ttag';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import ShareLinkModal from '../ShareLinkModal/ShareLinkModal';

interface Props {
    shareId: string;
    item: FileBrowserItem;
    className?: string;
}

const ShareButton = ({ shareId, item, className }: Props) => {
    const { createModal } = useModals();
    const btnClassName = classnames(['flex', 'flex-item-noshrink', className]);

    return (
        <PrimaryButton
            className={btnClassName}
            size="small"
            onClick={(e) => {
                e.stopPropagation();
                createModal(<ShareLinkModal shareId={shareId} item={item} />);
            }}
        >
            {c('Action').t`Share`}
        </PrimaryButton>
    );
};

export default ShareButton;
