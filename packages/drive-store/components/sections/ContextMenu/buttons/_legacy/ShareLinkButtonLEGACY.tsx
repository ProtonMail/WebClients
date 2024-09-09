import { c } from 'ttag';

import type { DecryptedLink } from '../../../../../store';
import type { useLinkSharingModal } from '../../../../modals/ShareLinkModal/ShareLinkModal';
import ContextMenuButton from '../../ContextMenuButton';

interface Props {
    shareId: string;
    link: DecryptedLink;
    showLinkSharingModal: ReturnType<typeof useLinkSharingModal>[1];
    close: () => void;
}

const ShareLinkButtonLEGACY = ({ shareId, link, showLinkSharingModal, close }: Props) => {
    const hasSharedLink = !!link.shareUrl;

    return (
        <ContextMenuButton
            name={hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Get link`}
            icon={hasSharedLink ? 'link-pen' : 'link'}
            testId={hasSharedLink ? 'context-menu-manage-link' : 'context-menu-share-link'}
            action={() => showLinkSharingModal({ shareId, linkId: link.linkId })}
            close={close}
        />
    );
};

export default ShareLinkButtonLEGACY;
