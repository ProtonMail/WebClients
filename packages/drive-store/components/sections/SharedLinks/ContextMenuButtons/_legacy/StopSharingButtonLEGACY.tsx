import { c } from 'ttag';

import type { DecryptedLink, useActions } from '../../../../../store';
import { ContextMenuButton } from '../../../ContextMenu';

interface Props {
    selectedLinks: DecryptedLink[];
    stopSharingLinks: ReturnType<typeof useActions>['stopSharingLinks'];
    close: () => void;
}

const StopSharingButtonLEGACY = ({ selectedLinks, stopSharingLinks, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Stop sharing`}
            icon="link-slash"
            testId="context-menu-stop-sharing"
            action={() => stopSharingLinks(new AbortController().signal, selectedLinks)}
            close={close}
        />
    );
};

export default StopSharingButtonLEGACY;
