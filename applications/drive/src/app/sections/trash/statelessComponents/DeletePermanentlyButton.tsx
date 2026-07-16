import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { CommonButtonProps } from '../../commonButtons/types';

export const DeletePermanentlyButton = ({ buttonType, onClick, close }: CommonButtonProps) => {
    const title = c('Action').t`Delete permanently`;

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcCrossCircle alt={title} />}
                onClick={onClick}
                data-testid="toolbar-delete"
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={<IcCrossCircle />}
                testId="context-menu-delete"
                action={onClick}
                close={close}
            />
        );
    }
};
