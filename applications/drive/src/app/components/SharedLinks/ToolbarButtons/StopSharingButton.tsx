import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { useSharedLinksContent } from '../SharedLinksContentProvider';

interface Props {
    shareId: string;
    disabled?: boolean;
}

const StopSharingButton = ({ shareId, disabled }: Props) => {
    const { openStopSharing } = useToolbarActions();
    const { fileBrowserControls } = useSharedLinksContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Stop sharing`}
            icon={<Icon name="broken-link" />}
            onClick={() => openStopSharing(shareId, selectedItems)}
            data-testid="toolbar-button-stop-sharing"
        />
    );
};

export default StopSharingButton;
