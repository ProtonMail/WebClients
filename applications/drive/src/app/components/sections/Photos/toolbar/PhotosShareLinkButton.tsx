import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { Icon, ToolbarButton } from '@proton/components';

import type { PhotoLink } from '../../../../store';
import { isDecryptedLink } from '../../../../store/_photos/utils/isDecryptedLink';
import { getSharedStatus } from '../../../../utils/share';
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

    const sharedStatus = getSharedStatus(link);
    const hasSharedLink = !!link.shareUrl;
    const iconName = sharedStatus === 'shared' ? 'users' : 'user-plus';

    return (
        <>
            <ToolbarButton
                title={hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Get link`}
                icon={<Icon name={iconName} alt={hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Share`} />}
                onClick={() =>
                    showLinkSharingModal({ volumeId: link.volumeId, shareId: link.rootShareId, linkId: link.linkId })
                }
                data-testid={hasSharedLink ? 'toolbar-manage-link' : 'toolbar-share-link'}
            />
            {linkSharingModal}
        </>
    );
};

export default PhotosShareLinkButton;
