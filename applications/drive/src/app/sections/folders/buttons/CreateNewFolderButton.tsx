import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcFolderPlus } from '@proton/icons/icons/IcFolderPlus';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { ActionButtonProps } from '../../buttons/types';

export const CreateNewFolderButton = ({ type, close, onClick }: ActionButtonProps) => {
    const title = c('Action').t`New folder`;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                data-testid="toolbar-new-folder"
                icon={<IcFolderPlus alt={title} />}
                title={title}
                onClick={onClick}
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                testId="context-menu-new-folder"
                icon={<IcFolderPlus />}
                name={title}
                action={onClick}
                close={close}
            />
        );
    }
};
