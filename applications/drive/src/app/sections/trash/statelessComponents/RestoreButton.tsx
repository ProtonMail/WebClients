import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { CommonButtonProps } from '../../commonButtons/types';

export const RestoreButton = ({ buttonType, onClick, close }: CommonButtonProps) => {
    const title = c('Action').t`Restore from trash`;

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcArrowRotateRight alt={title} />}
                onClick={onClick}
                data-testid="toolbar-restore"
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={<IcArrowRotateRight />}
                testId="context-menu-restore"
                action={onClick}
                close={close}
            />
        );
    }
};
