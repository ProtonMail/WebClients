import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { DecryptedLink } from '../../../store';
import useOpenModal from '../../useOpenModal';
import { isMultiSelect, noSelection } from './utils';

interface Props {
    selectedLinks: DecryptedLink[];
}

const ShareLinkButton = ({ selectedLinks }: Props) => {
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
            onClick={() => openLinkSharing(selectedLinks[0].rootShareId, selectedLinks[0].linkId)}
            data-testid="toolbar-share-link"
        />
    );
};

export default ShareLinkButton;
