import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { FileBrowserItem } from '../interfaces';
import { noSelection, isMultiSelect, hasFoldersSelected } from './utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const ShareLinkButton = ({ shareId, selectedItems }: Props) => {
    const { openLinkSharing } = useToolbarActions();

    const hasSharedLink = !!selectedItems[0]?.SharedUrl;

    return (
        <ToolbarButton
            disabled={noSelection(selectedItems) || isMultiSelect(selectedItems) || hasFoldersSelected(selectedItems)}
            title={hasSharedLink ? c('Action').t`Sharing options` : c('Action').t`Share via link`}
            icon={<Icon name="link" />}
            onClick={() => openLinkSharing(shareId, selectedItems[0])}
            data-testid="toolbar-share"
        />
    );
};

export default ShareLinkButton;
