import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';

import { ContextMenuButton } from '../../statelessComponents/ContextMenu';
import type { ActionButtonProps } from './types';

export const RenameActionButton = ({ onClick, type, close }: ActionButtonProps) => {
    const title = c('Action').t`Rename`;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcPenSquare alt={title} />}
                onClick={onClick}
                data-testid="toolbar-rename"
            />
        );
    }
    if (type === 'context') {
        return (
            <ContextMenuButton
                name={title}
                icon={<IcPenSquare />}
                testId="context-menu-rename"
                action={onClick}
                close={close}
            />
        );
    }
};
