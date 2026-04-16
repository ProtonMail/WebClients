import { c } from 'ttag';

import type { useSharingModal } from '@proton/drive/modules/sharingModal';

import type { useFileSharingModal } from '../../../../modals/SelectLinkToShareModal';
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
