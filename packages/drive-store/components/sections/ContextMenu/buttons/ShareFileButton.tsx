import { c } from 'ttag';

import type { useFileSharingModal } from '../../../modals/SelectLinkToShareModal/SelectLinkToShareModal';
import type { useLinkSharingModal } from '../../../modals/ShareLinkModal/ShareLinkModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    showFileSharingModal: ReturnType<typeof useFileSharingModal>[1];
    showLinkSharingModal: ReturnType<typeof useLinkSharingModal>[1];
    isSharedWithMe?: boolean;
    close: () => void;
}

const ShareButton = ({ shareId, isSharedWithMe, showFileSharingModal, showLinkSharingModal, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Share`}
            icon={isSharedWithMe ? 'users' : 'user-plus'}
            testId="context-menu-folder"
            action={() => showFileSharingModal({ shareId, showLinkSharingModal })}
            close={close}
        />
    );
};

export default ShareButton;
