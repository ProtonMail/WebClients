import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useOpenModal from '../../useOpenModal';
import { isMultiSelect, hasFoldersSelected } from './utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const PreviewButton = ({ shareId, selectedItems }: Props) => {
    const { openPreview } = useOpenModal();

    const disabled =
        isMultiSelect(selectedItems) ||
        hasFoldersSelected(selectedItems) ||
        !selectedItems[0]?.MIMEType ||
        !isPreviewAvailable(selectedItems[0].MIMEType, selectedItems[0].Size);
    if (disabled) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Preview`}
            icon={<Icon name="eye" />}
            onClick={() => {
                if (selectedItems.length) {
                    openPreview(shareId, selectedItems[0]);
                }
            }}
            data-testid="toolbar-preview"
        />
    );
};

export default PreviewButton;
