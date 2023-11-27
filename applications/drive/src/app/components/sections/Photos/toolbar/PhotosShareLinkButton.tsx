import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, ToolbarButton } from '@proton/components';

import { PhotoLink } from '../../../../store';
import { isDecryptedLink } from '../../../../store/_photos/utils/isDecryptedLink';
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

    if (!isDecryptedLink(link)) {
        return (
            <ToolbarButton
                title={c('Action').t`Loading link`}
                disabled
                icon={<CircleLoader />}
                data-testid="toolbar-share-link"
            />
        );
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
