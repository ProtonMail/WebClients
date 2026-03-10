import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import type { CommonButtonProps } from '../../commonButtons/types';

export const DeletePermanentlyButton = ({ buttonType, onClick, close }: CommonButtonProps) => {
    const title = c('Action').t`Delete permanently`;
    const icon = 'cross-circle';

    if (buttonType === 'toolbar') {
        return <ToolbarButton title={title} icon={<IcCrossCircle />} onClick={onClick} data-testid="toolbar-delete" />;
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton name={title} icon={icon} testId="context-menu-delete" action={onClick} close={close} />
        );
    }
};
