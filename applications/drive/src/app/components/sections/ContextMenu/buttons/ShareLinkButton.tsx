import { c } from 'ttag';

import { DecryptedLink } from '../../../../store';
import { useLinkSharingModal } from '../../../modals/ShareLinkModal/ShareLinkModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    link: DecryptedLink;
    showLinkSharingModal: ReturnType<typeof useLinkSharingModal>[1];
    sharedWithMe?: boolean;
    close: () => void;
}

const ShareLinkButton = ({ shareId, link, showLinkSharingModal, sharedWithMe, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Share`}
            icon={sharedWithMe ? 'users' : 'user-plus'}
            testId="context-menu-share-link"
            action={() => showLinkSharingModal({ shareId, linkId: link.linkId })}
            close={close}
        />
    );
};

export default ShareLinkButton;
