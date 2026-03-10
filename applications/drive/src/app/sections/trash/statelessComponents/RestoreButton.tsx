import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import type { CommonButtonProps } from '../../commonButtons/types';

export const RestoreButton = ({ buttonType, onClick, close }: CommonButtonProps) => {
    const title = c('Action').t`Restore from trash`;
    const icon = 'arrow-rotate-right';

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcArrowRotateRight />}
                onClick={onClick}
                data-testid="toolbar-restore"
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton name={title} icon={icon} testId="context-menu-restore" action={onClick} close={close} />
        );
    }
};
