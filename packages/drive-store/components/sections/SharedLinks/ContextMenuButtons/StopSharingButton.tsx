import { c } from 'ttag';

import type { DecryptedLink, useActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    selectedLink: DecryptedLink;
    stopSharing: ReturnType<typeof useActions>['stopSharing'];
    close: () => void;
}

const StopSharingButton = ({ selectedLink, stopSharing, close }: Props) => {
    const shareId = selectedLink?.sharingDetails?.shareId;
    if (!shareId) {
        return;
    }
    return (
        <ContextMenuButton
            name={c('Action').t`Stop sharing`}
            icon="link-slash"
            testId="context-menu-stop-sharing"
            action={() => stopSharing(shareId)}
            close={close}
        />
    );
};

export default StopSharingButton;
