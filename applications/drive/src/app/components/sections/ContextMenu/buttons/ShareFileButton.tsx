import { c } from 'ttag';

import type { useSharingModal } from '../../../../modals/SharingModal/SharingModal';
import type { useFileSharingModal } from '../../../modals/SelectLinkToShareModal/SelectLinkToShareModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    showFileSharingModal: ReturnType<typeof useFileSharingModal>[1];
    showSharingModal: ReturnType<typeof useSharingModal>['showSharingModal'];
    isSharedWithMe?: boolean;
    close: () => void;
}

const ShareButton = ({ shareId, isSharedWithMe, showFileSharingModal, showSharingModal, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Share`}
            icon={isSharedWithMe ? 'users' : 'user-plus'}
            testId="context-menu-share-file-selection"
            action={() => showFileSharingModal({ shareId, showSharingModal })}
            close={close}
        />
    );
};

export default ShareButton;
