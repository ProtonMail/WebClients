import { c } from 'ttag';

import { useFileSharingModal } from '../../../modals/SelectLinkToShareModal/SelectLinkToShareModal';
import { useLinkSharingModal } from '../../../modals/ShareLinkModal/ShareLinkModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    showFileSharingModal: ReturnType<typeof useFileSharingModal>[1];
    showLinkSharingModal: ReturnType<typeof useLinkSharingModal>[1];
    close: () => void;
}

const ShareButton = ({ shareId, showFileSharingModal, showLinkSharingModal, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Get link`}
            icon="link"
            testId="context-menu-shareViaLink"
            action={() => showFileSharingModal({ shareId, showLinkSharingModal })}
            close={close}
        />
    );
};

export default ShareButton;
