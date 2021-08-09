import { useCallback } from 'react';
import { c } from 'ttag';

import useToolbarActions from '../../../../hooks/drive/useActions';
import { LinkType } from '../../../../interfaces/link';
import { FileBrowserItem } from '../../../FileBrowser';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    items: FileBrowserItem[];
    close: () => void;
}

const DetailsButton = ({ shareId, items, close }: Props) => {
    const { openDetails, openFilesDetails } = useToolbarActions();

    const action = useCallback(() => {
        if (items.length === 1 && items[0].Type === LinkType.FILE) {
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
