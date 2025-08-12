import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { type FolderButtonProps } from './types';

export const UploadFileButton = ({ type, close, onClick }: FolderButtonProps) => {
    const title = c('Action').t`Upload file`;
    const icon = 'file-arrow-in-up' as const;

    const handleClickWithClose = () => {
        onClick();
        close?.();
    };

    if (type === 'toolbar') {
        return (
            <>
                <ToolbarButton
                    data-testid="toolbar-upload-file"
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
                    testId="context-menu-upload-file"
                    icon={icon}
                    name={title}
                    action={handleClickWithClose}
                    close={close}
                />
            </>
        );
    }
};
