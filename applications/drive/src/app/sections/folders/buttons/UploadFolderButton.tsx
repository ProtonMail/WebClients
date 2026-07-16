import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcFolderArrowUp } from '@proton/icons/icons/IcFolderArrowUp';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { ActionButtonProps } from '../../buttons/types';

export const UploadFolderButton = ({ type, close, onClick }: ActionButtonProps) => {
    const title = c('Action').t`Upload folder`;

    const handleClickWithClose = () => {
        onClick();
        close?.();
    };

    if (type === 'toolbar') {
        return (
            <>
                <ToolbarButton
                    data-testid="toolbar-upload-folder"
                    icon={<IcFolderArrowUp alt={title} />}
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
                    icon={<IcFolderArrowUp />}
                    name={title}
                    action={handleClickWithClose}
                    close={close}
                />
            </>
        );
    }
};
