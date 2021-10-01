import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { MEMBER_SHARING_ENABLED } from '@proton/shared/lib/drive/constants';

import useToolbarActions from '../../../hooks/drive/useActions';
import { noSelection, isMultiSelect } from './utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const ShareButton = ({ shareId, selectedItems }: Props) => {
    const { openSharing } = useToolbarActions();

    if (!MEMBER_SHARING_ENABLED) {
        return <></>;
    }

    const hasShare = !!selectedItems[0]?.ShareUrlShareID;

    return (
        <ToolbarButton
            disabled={noSelection(selectedItems) || isMultiSelect(selectedItems)}
            title={hasShare ? c('Action').t`Share options` : c('Action').t`Share`}
            icon={<Icon name="user-group" />}
            onClick={() => openSharing(shareId, selectedItems[0])}
            data-testid="toolbar-share"
        />
    );
};

export default ShareButton;
