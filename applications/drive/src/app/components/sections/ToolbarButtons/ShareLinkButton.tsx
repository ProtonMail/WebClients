import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useOpenModal from '../../useOpenModal';
import { noSelection, isMultiSelect } from './utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const ShareLinkButton = ({ shareId, selectedItems }: Props) => {
    const { openLinkSharing } = useOpenModal();

    if (noSelection(selectedItems) || isMultiSelect(selectedItems)) {
        return null;
    }

    const hasSharedLink = !!selectedItems[0]?.SharedUrl;

    return (
        <ToolbarButton
            disabled={noSelection(selectedItems) || isMultiSelect(selectedItems)}
            title={hasSharedLink ? c('Action').t`Manage link` : c('Action').t`Get link`}
            icon={<Icon name={hasSharedLink ? 'link-pen' : 'link'} />}
            onClick={() => openLinkSharing(shareId, selectedItems[0])}
            data-testid="toolbar-share-link"
        />
    );
};

export default ShareLinkButton;
