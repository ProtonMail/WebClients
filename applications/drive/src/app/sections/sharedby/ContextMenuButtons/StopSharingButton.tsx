import { c } from 'ttag';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import type { useActions } from '../../../store';

interface Props {
    shareId: string;
    stopSharing: ReturnType<typeof useActions>['stopSharing'];
    close: () => void;
}

export const StopSharingButton = ({ shareId, stopSharing, close }: Props) => {
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
