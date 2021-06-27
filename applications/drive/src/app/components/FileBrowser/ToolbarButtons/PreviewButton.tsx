import { c } from 'ttag';

import { Icon, ToolbarButton, isPreviewAvailable } from '@proton/components';

import useToolbarActions from '../../../hooks/drive/useToolbarActions';
import { FileBrowserItem } from '../interfaces';
import { isMultiSelect, hasFoldersSelected } from './utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const PreviewButton = ({ shareId, selectedItems }: Props) => {
    const { preview } = useToolbarActions();

    const disabled =
        isMultiSelect(selectedItems) ||
        hasFoldersSelected(selectedItems) ||
        !selectedItems[0]?.MIMEType ||
        !isPreviewAvailable(selectedItems[0].MIMEType);

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Preview`}
            icon={<Icon name="eye" />}
            onClick={() => {
                if (selectedItems.length) {
                    preview(shareId, selectedItems[0]);
                }
            }}
            data-testid="toolbar-preview"
        />
    );
};

export default PreviewButton;
