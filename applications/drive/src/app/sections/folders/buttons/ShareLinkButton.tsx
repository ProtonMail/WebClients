import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import type { FolderButtonProps } from './types';

export const ShareLinkButton = ({ onClick, type, close }: FolderButtonProps) => {
    const title = c('Action').t`Share`;
    const icon = 'user-plus' as const;
    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={onClick}
                data-testid="toolbar-share-link"
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                name={title}
                icon={icon}
                testId="context-menu-share-link"
                action={onClick}
                close={close}
            />
        );
    }
};
