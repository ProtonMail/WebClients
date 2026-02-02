import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';

import { useLinkSharingModal } from '../../modals/ShareLinkModal/ShareLinkModal';

interface Props {
    volumeId: string;
    shareId: string;
    linkId: string;
    isAlbum?: boolean;
}

const ShareLinkButton = ({ volumeId, shareId, linkId, isAlbum }: Props) => {
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    return (
        <>
            <ToolbarButton
                title={c('Action').t`Share`}
                icon={<IcUserPlus alt={c('Action').t`Share`} />}
                onClick={() => showLinkSharingModal({ volumeId, shareId, linkId, isAlbum })}
                data-testid="toolbar-share-link"
            />
            {linkSharingModal}
        </>
    );
};

export default ShareLinkButton;
