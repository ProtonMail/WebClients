import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useToolbarActions from '../../../../hooks/drive/useActions';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const StopSharingButton = ({ shareId, selectedItems }: Props) => {
    const { openStopSharing } = useToolbarActions();

    return (
        <ToolbarButton
            disabled={selectedItems.length === 0}
            title={c('Action').t`Stop sharing`}
            icon={<Icon name="link-broken" />}
            onClick={() => openStopSharing(shareId, selectedItems)}
            data-testid="toolbar-button-stop-sharing"
        />
    );
};

export default StopSharingButton;
