import { c } from 'ttag';

import { Icon, ToolbarButton, useLoading } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useActions } from '../../../../store';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const RestoreFromTrashButton = ({ shareId, selectedItems }: Props) => {
    const [restoreLoading, withRestoreLoading] = useLoading();
    const { restoreLinks } = useActions();

    return (
        <ToolbarButton
            disabled={restoreLoading}
            title={c('Action').t`Restore from trash`}
            icon={<Icon name="arrow-rotate-right" />}
            onClick={() =>
                withRestoreLoading(
                    restoreLinks(
                        new AbortController().signal,
                        shareId,
                        selectedItems.map((item) => ({ linkId: item.LinkID, name: item.Name, type: item.Type }))
                    )
                )
            }
            data-testid="toolbar-restore"
        />
    );
};

export default RestoreFromTrashButton;
