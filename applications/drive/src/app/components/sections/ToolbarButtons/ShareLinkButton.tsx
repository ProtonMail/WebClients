import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import type { DecryptedLink } from '../../../store';
import { useLinkSharingModal } from '../../modals/ShareLinkModal/ShareLinkModal';
import { isMultiSelect, noSelection } from './utils';

interface Props {
    selectedLinks: DecryptedLink[];
}

const ShareLinkButton = ({ selectedLinks }: Props) => {
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();

    if (noSelection(selectedLinks) || isMultiSelect(selectedLinks)) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                disabled={noSelection(selectedLinks) || isMultiSelect(selectedLinks)}
                title={c('Action').t`Share`}
                icon={<Icon name="user-plus" alt={c('Action').t`Share`} />}
                onClick={() =>
                    showLinkSharingModal({ shareId: selectedLinks[0].rootShareId, linkId: selectedLinks[0].linkId })
                }
                data-testid="toolbar-share-link"
            />
            {linkSharingModal}
        </>
    );
};

export default ShareLinkButton;
