import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useActions } from '../../../../store';
import { noSelection } from '../../ToolbarButtons/utils';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const StopSharingButton = ({ shareId, selectedItems }: Props) => {
    const { stopSharingLinks } = useActions();

    if (noSelection(selectedItems)) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Stop sharing`}
            icon={<Icon name="link-broken" />}
            onClick={() =>
                stopSharingLinks(
                    new AbortController().signal,
                    shareId,
                    selectedItems.map((item) => ({ linkId: item.LinkID, name: item.Name, type: item.Type }))
                )
            }
            data-testid="toolbar-button-stop-sharing"
        />
    );
};

export default StopSharingButton;
