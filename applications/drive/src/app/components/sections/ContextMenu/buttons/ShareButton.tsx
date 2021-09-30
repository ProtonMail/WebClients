import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { MEMBER_SHARING_ENABLED } from '@proton/shared/lib/drive/constants';

import useToolbarActions from '../../../../hooks/drive/useActions';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    item: FileBrowserItem;
    close: () => void;
}

const ShareButton = ({ shareId, item, close }: Props) => {
    const { openSharing } = useToolbarActions();

    if (!MEMBER_SHARING_ENABLED) {
        return <></>;
    }

    const hasShare = !!item.ShareUrlShareID;

    return (
        <ContextMenuButton
            name={hasShare ? c('Action').t`Share options` : c('Action').t`Share`}
            icon="user-group"
            testId="context-menu-share"
            action={() => openSharing(shareId, item)}
            close={close}
        />
    );
};

export default ShareButton;
