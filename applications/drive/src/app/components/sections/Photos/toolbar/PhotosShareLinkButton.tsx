import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { PhotoLink } from '../../../../store';
import { useLinkSharingModal } from '../../../modals/ShareLinkModal/ShareLinkModal';

interface Props {
    selectedLinks: PhotoLink[];
}

const PhotosShareLinkButton = ({ selectedLinks }: Props) => {
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();

    const link = selectedLinks[0];

    if (!link) {
        return null;
    }

    const hasSharedLink = !!link.shareUrl;

    return (
        <>
            <ToolbarButton
                title={hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Get link`}
                icon={
                    <Icon
                        name={hasSharedLink ? 'link-pen' : 'link'}
                        alt={hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Get link`}
                    />
                }
                onClick={() => showLinkSharingModal({ shareId: link.rootShareId, linkId: link.linkId })}
                data-testid="toolbar-share-link"
            />
            {linkSharingModal}
        </>
    );
};

export default PhotosShareLinkButton;
