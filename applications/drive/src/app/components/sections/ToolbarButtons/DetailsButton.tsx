import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive//fileBrowser';

import useOpenModal from '../../useOpenModal';
import { noSelection } from './utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const DetailsButton = ({ shareId, selectedItems }: Props) => {
    const { openDetails, openFilesDetails } = useOpenModal();

    if (noSelection(selectedItems)) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Details`}
            icon={<Icon name="circle-info" />}
            onClick={() => {
                if (selectedItems.length === 1) {
                    openDetails(shareId, selectedItems[0]);
                } else if (selectedItems.length > 1) {
                    openFilesDetails(selectedItems);
                }
            }}
            data-testid="toolbar-details"
        />
    );
};

export default DetailsButton;
