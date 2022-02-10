import { useCallback } from 'react';
import { c } from 'ttag';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useOpenModal from '../../../useOpenModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    items: FileBrowserItem[];
    close: () => void;
}

const DetailsButton = ({ shareId, items, close }: Props) => {
    const { openDetails, openFilesDetails } = useOpenModal();

    const action = useCallback(() => {
        if (items.length === 1) {
            openDetails(shareId, items[0]);
        } else {
            openFilesDetails(items);
        }
    }, [shareId, items, openDetails, openFilesDetails]);

    return (
        <ContextMenuButton
            name={c('Action').t`Details`}
            icon="circle-info"
            testId="context-menu-details"
            action={action}
            close={close}
        />
    );
};

export default DetailsButton;
