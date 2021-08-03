import { useCallback } from 'react';
import { c } from 'ttag';

import { Icon, Tooltip, useModals } from '@proton/components';
import SharingModal from '../SharingModal/SharingModal';
import { FileBrowserItem } from './interfaces';

interface Props {
    shareId: string;
    item: FileBrowserItem;
    className?: string;
}

const getItemTooltipText = (item: FileBrowserItem) => {
    if (item.UrlsExpired) {
        return c('Tooltip').t`Expired sharing link`;
    }
    if (item.Trashed) {
        return c('Tooltip').t`Inactive sharing link`;
    }

    return c('Tooltip').t`Active sharing link`;
};

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

    const iconClassName = !item.UrlsExpired && !item.Trashed ? 'color-info' : 'color-weak';

    return (
        <Tooltip title={getItemTooltipText(item)}>
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
                <Icon className={iconClassName} name="link" alt={c('Action').t`Show shared link details`} />
            </button>
        </Tooltip>
    );
};

export default SharedURLIcon;
