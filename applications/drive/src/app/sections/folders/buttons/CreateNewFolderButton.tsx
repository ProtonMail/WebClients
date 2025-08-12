import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { type FolderButtonProps } from './types';

export const CreateNewFolderButton = ({ type, close, onClick }: FolderButtonProps) => {
    const title = c('Action').t`Create new folder`;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                data-testid="toolbar-new-folder"
                icon={<Icon name="folder-plus" alt={title} />}
                title={title}
                onClick={onClick}
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                testId="context-menu-new-folder"
                icon="folder-plus"
                name={title}
                action={onClick}
                close={close}
            />
        );
    }
};
