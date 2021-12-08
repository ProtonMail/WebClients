import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import useOpenModal from '../../../useOpenModal';
import ContextMenuButton from '../ContextMenuButton';

interface Props {
    shareId: string;
    item: FileBrowserItem;
    close: () => void;
}

const ShareLinkButton = ({ shareId, item, close }: Props) => {
    const { openLinkSharing } = useOpenModal();

    const hasSharedLink = !!item.SharedUrl;

    return (
        <ContextMenuButton
            name={hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Get link`}
            icon={hasSharedLink ? 'link-pen' : 'link'}
            testId="context-menu-share-link"
            action={() => openLinkSharing(shareId, item)}
            close={close}
        />
    );
};

export default ShareLinkButton;
