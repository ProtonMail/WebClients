import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { MEMBER_SHARING_ENABLED } from '@proton/shared/lib/drive/constants';

import useOpenModal from '../../useOpenModal';
import { noSelection, isMultiSelect } from './utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const ShareButton = ({ shareId, selectedItems }: Props) => {
    const { openSharing } = useOpenModal();

    if (!MEMBER_SHARING_ENABLED || noSelection(selectedItems) || isMultiSelect(selectedItems)) {
        return null;
    }

    const hasShare = !!selectedItems[0]?.ShareUrlShareID;

    return (
        <ToolbarButton
            title={hasShare ? c('Action').t`Share options` : c('Action').t`Share`}
            icon={<Icon name="user-group" />}
            onClick={() => openSharing(shareId, selectedItems[0])}
            data-testid="toolbar-share"
        />
    );
};

export default ShareButton;
