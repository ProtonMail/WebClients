import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import type { FolderButtonProps } from './types';

export const CopyButton = ({ type, onClick, close }: FolderButtonProps) => {
    const title = c('Action').t`Make a copy`;
    const icon = 'image-stacked';

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={onClick}
                data-testid="toolbar-copy"
            />
        );
    }

    if (type === 'context') {
        return <ContextMenuButton name={title} icon={icon} testId="context-menu-copy" action={onClick} close={close} />;
    }
};
