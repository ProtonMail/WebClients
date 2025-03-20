import { c } from 'ttag';

import type { useLinkSharingModal } from '../../../modals/ShareLinkModal/ShareLinkModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    linkId: string;
    showLinkSharingModal: ReturnType<typeof useLinkSharingModal>[1];
    isSharedWithMe?: boolean;
    close: () => void;
}

const ShareLinkButton = ({ shareId, linkId, showLinkSharingModal, isSharedWithMe, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Share`}
            icon={isSharedWithMe ? 'users' : 'user-plus'}
            testId="context-menu-share-link"
            action={() => showLinkSharingModal({ shareId, linkId })}
            close={close}
        />
    );
};

export default ShareLinkButton;
