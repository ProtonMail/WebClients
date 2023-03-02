import { c } from 'ttag';

import { DecryptedLink } from '../../../../store';
import useOpenModal from '../../../useOpenModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    link: DecryptedLink;
    close: () => void;
}

const ShareLinkButton = ({ shareId, link, close }: Props) => {
    const { openLinkSharing } = useOpenModal();

    const hasSharedLink = !!link.shareUrl;

    return (
        <ContextMenuButton
            name={hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Get link`}
            icon={hasSharedLink ? 'link-pen' : 'link'}
            testId="context-menu-manage-link"
            action={() => openLinkSharing(shareId, link.linkId)}
            close={close}
        />
    );
};

export default ShareLinkButton;
