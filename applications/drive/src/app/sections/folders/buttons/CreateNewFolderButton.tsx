import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcFolderPlus } from '@proton/icons/icons/IcFolderPlus';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import type { FolderButtonProps } from './types';

export const CreateNewFolderButton = ({ type, close, onClick }: FolderButtonProps) => {
    if (type === 'toolbar') {
        return (
            <ToolbarButton
                data-testid="toolbar-new-folder"
                icon={<IcFolderPlus alt={c('Action').t`Create new folder`} />}
                title={c('Action').t`Create new folder`}
                onClick={onClick}
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                testId="context-menu-new-folder"
                icon="folder-plus"
                name={c('Action').t`New folder`}
                action={onClick}
                close={close}
            />
        );
    }
};
