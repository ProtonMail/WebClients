import { c } from 'ttag';

import { Icon, ToolbarButton, useLoading } from '@proton/components';

import { useTrashContent } from '../TrashContentProvider';
import useToolbarActions from '../../../../hooks/drive/useActions';

interface Props {
    shareId: string;
}

const RestoreFromTrashButton = ({ shareId }: Props) => {
    const [restoreLoading, withRestoreLoading] = useLoading();
    const { restoreFromTrash } = useToolbarActions();
    const { fileBrowserControls } = useTrashContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <ToolbarButton
            disabled={restoreLoading}
            title={c('Action').t`Restore from trash`}
            icon={<Icon name="arrow-rotate-right" />}
            onClick={() => withRestoreLoading(restoreFromTrash(shareId, selectedItems))}
            data-testid="toolbar-restore"
        />
    );
};

export default RestoreFromTrashButton;
