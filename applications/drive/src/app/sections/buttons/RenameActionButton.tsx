import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../components/sections/ContextMenu';
import type { ActionButtonProps } from './types';

export const RenameActionButton = ({ onClick, type, close }: ActionButtonProps) => {
    const title = c('Action').t`Rename`;
    const icon = 'pen-square' as const;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={onClick}
                data-testid="toolbar-rename"
            />
        );
    }
    if (type === 'context') {
        return (
            <ContextMenuButton name={title} icon={icon} testId="context-menu-rename" action={onClick} close={close} />
        );
    }
};
