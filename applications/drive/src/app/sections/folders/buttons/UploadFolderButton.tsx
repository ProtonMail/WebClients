import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { type FolderButtonProps } from './types';

export const UploadFolderButton = ({ type, close, onClick }: FolderButtonProps) => {
    const title = c('Action').t`Upload folder`;
    const icon = 'folder-arrow-up' as const;

    const handleClickWithClose = () => {
        onClick();
        close?.();
    };

    if (type === 'toolbar') {
        return (
            <>
                <ToolbarButton
                    data-testid="toolbar-upload-folder"
                    icon={<Icon name={icon} alt={title} />}
                    title={title}
                    onClick={handleClickWithClose}
                />
            </>
        );
    }

    if (type === 'context') {
        return (
            <>
                <ContextMenuButton
                    testId="context-menu-upload-folder"
                    icon={icon}
                    name={title}
                    action={handleClickWithClose}
                    close={close}
                />
            </>
        );
    }
};
