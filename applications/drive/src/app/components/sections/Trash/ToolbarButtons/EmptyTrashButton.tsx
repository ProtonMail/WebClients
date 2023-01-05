import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import useActiveShare from '../../../../hooks/drive/useActiveShare';
import { useActions, useIsEmptyTrashButtonAvailable } from '../../../../store';

const EmptyTrashButton = () => {
    const { activeShareId } = useActiveShare();
    const { emptyTrash } = useActions();
    const disabled = !useIsEmptyTrashButtonAvailable();

    const handleEmptyTrashClick = () => {
        void emptyTrash(new AbortController().signal, activeShareId);
    };

    return (
        <ToolbarButton
            disabled={disabled}
            title={c('Action').t`Empty trash`}
            icon={<Icon name="broom" />}
            onClick={handleEmptyTrashClick}
            data-testid="toolbar-restore"
        />
    );
};

export default EmptyTrashButton;
