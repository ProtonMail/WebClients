import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import useToolbarActions from '../../../../hooks/drive/useActions';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    items: FileBrowserItem[];
    close: () => void;
}

const StopSharingButton = ({ shareId, items, close }: Props) => {
    const { openStopSharing } = useToolbarActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Stop sharing`}
            icon="link-broken"
            testId="context-menu-stop-sharing"
            action={() => openStopSharing(shareId, items)}
            close={close}
        />
    );
};

export default StopSharingButton;
