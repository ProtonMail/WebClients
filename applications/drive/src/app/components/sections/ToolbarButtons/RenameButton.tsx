import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useToolbarActions from '../../../hooks/drive/useActions';
import { noSelection, isMultiSelect } from './utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const RenameButton = ({ shareId, selectedItems }: Props) => {
    const { openRename } = useToolbarActions();

    return (
        <ToolbarButton
            disabled={noSelection(selectedItems) || isMultiSelect(selectedItems)}
            title={c('Action').t`Rename`}
            icon={<Icon name="note-pen" />}
            onClick={() => openRename(shareId, selectedItems[0])}
            data-testid="toolbar-rename"
        />
    );
};

export default RenameButton;
