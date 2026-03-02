import { c } from 'ttag';

import type { useFileSharingModal } from '../../../../modals/SelectLinkToShareModal';
import type { useSharingModal } from '../../../../modals/SharingModal/SharingModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    showFileSharingModal: ReturnType<typeof useFileSharingModal>[1];
    showSharingModal: ReturnType<typeof useSharingModal>['showSharingModal'];
    isSharedWithMe?: boolean;
    close: () => void;
}

const ShareButton = ({ isSharedWithMe, showFileSharingModal, showSharingModal, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Share`}
            icon={isSharedWithMe ? 'users' : 'user-plus'}
            testId="context-menu-share-file-selection"
            action={() => showFileSharingModal({ showSharingModal })}
            close={close}
        />
    );
};

export default ShareButton;
