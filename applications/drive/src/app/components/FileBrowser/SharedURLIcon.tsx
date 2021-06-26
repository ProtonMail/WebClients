import React, { useCallback } from 'react';
import { c } from 'ttag';

import { Icon, Tooltip, useModals } from '@proton/components';
import SharingModal from '../SharingModal/SharingModal';
import { FileBrowserItem } from './interfaces';

interface Props {
    shareId: string;
    item: FileBrowserItem;
    className?: string;
}

const SharedURLIcon = ({ shareId, item, className }: Props) => {
    const { createModal } = useModals();

    const handleOpeningModal = useCallback(
        (e) => {
            e.stopPropagation(); // To not show file preview when clicking (to not trigger other click event).
            e.preventDefault(); // To not show file preview when pressing enter (to disable click event).
            createModal(<SharingModal shareId={shareId} item={item} />);
        },
        [shareId, item]
    );

    return (
        <Tooltip title={item.UrlsExpired ? c('Tooltip').t`Expired sharing link` : c('Tooltip').t`Active sharing link`}>
            <button
                type="button"
                className={className || 'flex flex-item-noshrink'}
                onClick={handleOpeningModal}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleOpeningModal(e);
                    }
                }}
            >
                <Icon className={!item.UrlsExpired ? 'color-info' : 'color-weak'} name="link" />
            </button>
        </Tooltip>
    );
};

export default SharedURLIcon;
