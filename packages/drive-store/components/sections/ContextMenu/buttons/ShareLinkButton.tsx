import { c } from 'ttag';

import { useNewFeatureTag } from '@proton/components/components';

import type { DecryptedLink } from '../../../../store';
import type { useLinkSharingModal } from '../../../modals/ShareLinkModal/ShareLinkModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    link: DecryptedLink;
    showLinkSharingModal: ReturnType<typeof useLinkSharingModal>[1];
    isSharedWithMe?: boolean;
    close: () => void;
}

const ShareLinkButton = ({ shareId, link, showLinkSharingModal, isSharedWithMe, close }: Props) => {
    const { onWasShown, Component: NewFeatureTag } = useNewFeatureTag('drive-sharing');

    const handleAction = () => {
        showLinkSharingModal({ shareId, linkId: link.linkId });
        onWasShown();
    };

    return (
        <ContextMenuButton
            name={c('Action').t`Share`}
            icon={isSharedWithMe ? 'users' : 'user-plus'}
            testId="context-menu-share-link"
            action={handleAction}
            close={close}
        >
            <NewFeatureTag />
        </ContextMenuButton>
    );
};

export default ShareLinkButton;
