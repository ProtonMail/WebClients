import { c } from 'ttag';

import { generateNodeUid, getDrive } from '@proton/drive';

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
            // Forced to getDrive as it's legacy stuff not used in shared with me or shared by me
            action={() => showSharingModal({ nodeUid: generateNodeUid(volumeId, linkId), drive: getDrive() })}
            close={close}
        />
    );
};

export default ShareLinkButton;
