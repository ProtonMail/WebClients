import { c } from 'ttag';

import { DecryptedLink } from '../../../../store';
import { useLinkSharingModal } from '../../../modals/ShareLinkModal/ShareLinkModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    link: DecryptedLink;
    showLinkSharingModal: ReturnType<typeof useLinkSharingModal>[1];
    isSharedWithMe?: boolean;
    close: () => void;
}

const ShareLinkButton = ({ shareId, link, showLinkSharingModal, isSharedWithMe, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Share`}
            icon={isSharedWithMe ? 'users' : 'user-plus'}
            testId="context-menu-share-link"
            action={() => showLinkSharingModal({ shareId, linkId: link.linkId })}
            close={close}
        />
    );
};

export default ShareLinkButton;
