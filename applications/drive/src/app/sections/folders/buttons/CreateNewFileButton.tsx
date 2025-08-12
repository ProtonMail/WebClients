import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { type FolderButtonProps } from './types';

export const CreateNewFileButton = ({ type, close, onClick }: FolderButtonProps) => {
    const title = c('Action').t`Create new text file`;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                data-testid="toolbar-create-new-file"
                icon={<Icon name="file" alt={title} />}
                title={title}
                onClick={onClick}
            />
        );
    }

    if (type === 'context') {
        return <ContextMenuButton testId="toolbar-new-file" icon="file" name={title} action={onClick} close={close} />;
    }
};
