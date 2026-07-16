import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcFileArrowInUp } from '@proton/icons/icons/IcFileArrowInUp';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { ActionButtonProps } from '../../buttons/types';

export const UploadFileButton = ({ type, close, onClick }: ActionButtonProps) => {
    const title = c('Action').t`Upload file`;

    const handleClickWithClose = () => {
        onClick();
        close?.();
    };

    if (type === 'toolbar') {
        return (
            <>
                <ToolbarButton
                    data-testid="toolbar-upload-file"
                    icon={<IcFileArrowInUp alt={title} />}
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
                    icon={<IcFileArrowInUp />}
                    name={title}
                    action={handleClickWithClose}
                    close={close}
                />
            </>
        );
    }
};
