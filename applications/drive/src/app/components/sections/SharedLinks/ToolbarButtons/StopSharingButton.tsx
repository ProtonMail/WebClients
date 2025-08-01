import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import type { DecryptedLink } from '../../../../store';
import { useActions } from '../../../../store';
import { isMultiSelect, noSelection } from '../../ToolbarButtons/utils';

interface Props {
    selectedLinks: DecryptedLink[];
}

const StopSharingButton = ({ selectedLinks }: Props) => {
    //TODO: Migrate to sdk stopSharing
    const { stopSharing, confirmModal } = useActions();

    if (noSelection(selectedLinks) || isMultiSelect(selectedLinks)) {
        return null;
    }

    const shareId = selectedLinks[0]?.sharingDetails?.shareId;
    if (!shareId) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Stop sharing`}
                icon={<Icon name="link-slash" />}
                onClick={() => stopSharing(shareId)}
                data-testid="toolbar-button-stop-sharing"
            />
            {confirmModal}
        </>
    );
};

export default StopSharingButton;
