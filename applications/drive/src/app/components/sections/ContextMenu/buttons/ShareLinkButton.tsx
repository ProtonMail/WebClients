import { c } from 'ttag';

import { generateNodeUid } from '@proton/drive/index';

import type { useSharingModal } from '../../../../modals/SharingModal/SharingModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    volumeId: string;
    linkId: string;
    showSharingModal: ReturnType<typeof useSharingModal>['showSharingModal'];
    isSharedWithMe?: boolean;
    isAlbum?: boolean;
    close: () => void;
}

const ShareLinkButton = ({ volumeId, linkId, showSharingModal, isSharedWithMe, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Share`}
            icon={isSharedWithMe ? 'users' : 'user-plus'}
            testId="context-menu-share-link"
            action={() => showSharingModal({ nodeUid: generateNodeUid(volumeId, linkId) })}
            close={close}
        />
    );
};

export default ShareLinkButton;
