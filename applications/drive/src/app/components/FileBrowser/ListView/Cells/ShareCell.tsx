import React from 'react';

import { PrimaryButton, useModals } from 'react-components';
import { c } from 'ttag';
import SharingModal from '../../../SharingModal/SharingModal';
import { FileBrowserItem } from '../../interfaces';

interface Props {
    shareId: string;
    item: FileBrowserItem;
}

const ShareCell = ({ shareId, item }: Props) => {
    const { createModal } = useModals();

    return (
        <PrimaryButton
            className="flex flex-item-noshrink file-browser-list-item--share"
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

export default ShareCell;
