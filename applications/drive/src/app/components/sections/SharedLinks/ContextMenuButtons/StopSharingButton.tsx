import { c } from 'ttag';

import { DecryptedLink, useActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
    close: () => void;
}

const StopSharingButton = ({ shareId, selectedLinks, close }: Props) => {
    const { stopSharingLinks } = useActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Stop sharing`}
            icon="link-slash"
            testId="context-menu-stop-sharing"
            action={() => stopSharingLinks(new AbortController().signal, shareId, selectedLinks)}
            close={close}
        />
    );
};

export default StopSharingButton;
