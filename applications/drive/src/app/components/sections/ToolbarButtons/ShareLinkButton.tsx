import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink } from '../../../store';
import useOpenModal from '../../useOpenModal';
import { noSelection, isMultiSelect } from './utils';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
}

const ShareLinkButton = ({ shareId, selectedLinks }: Props) => {
    const { openLinkSharing } = useOpenModal();

    if (noSelection(selectedLinks) || isMultiSelect(selectedLinks)) {
        return null;
    }

    const hasSharedLink = !!selectedLinks[0]?.shareUrl;

    return (
        <ToolbarButton
            disabled={noSelection(selectedLinks) || isMultiSelect(selectedLinks)}
            title={hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Get link`}
            icon={<Icon name={hasSharedLink ? 'link-pen' : 'link'} />}
            onClick={() => openLinkSharing(shareId, selectedLinks[0].linkId)}
            data-testid="toolbar-share-link"
        />
    );
};

export default ShareLinkButton;
