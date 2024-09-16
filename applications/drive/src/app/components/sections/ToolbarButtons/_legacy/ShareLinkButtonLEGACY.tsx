import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import type { DecryptedLink } from '../../../../store';
import { useLinkSharingModal } from '../../../modals/ShareLinkModal/ShareLinkModal';
import { isMultiSelect, noSelection } from '../utils';

interface Props {
    selectedLinks: DecryptedLink[];
}

const ShareLinkButtonLEGACY = ({ selectedLinks }: Props) => {
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();

    if (noSelection(selectedLinks) || isMultiSelect(selectedLinks)) {
        return null;
    }

    const hasSharedLink = !!selectedLinks[0]?.shareUrl;

    return (
        <>
            <ToolbarButton
                disabled={noSelection(selectedLinks) || isMultiSelect(selectedLinks)}
                title={hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Get link`}
                icon={
                    <Icon
                        name={hasSharedLink ? 'link-pen' : 'link'}
                        alt={hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Get link`}
                    />
                }
                onClick={() =>
                    showLinkSharingModal({ shareId: selectedLinks[0].rootShareId, linkId: selectedLinks[0].linkId })
                }
                data-testid={hasSharedLink ? 'toolbar-manage-link' : 'toolbar-share-link'}
            />
            {linkSharingModal}
        </>
    );
};

export default ShareLinkButtonLEGACY;
