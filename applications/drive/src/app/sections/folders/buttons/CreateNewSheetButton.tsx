import { c } from 'ttag';

import { MimeIcon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { type FolderButtonProps } from './types';

export const CreateNewSheetButton = ({ type, close, onClick }: FolderButtonProps) => {
    const title = c('Action').t`New spreadsheet`;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                data-testid="toolbar-new-sheet"
                icon={<MimeIcon name="proton-sheet" />}
                title={title}
                onClick={onClick}
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                testId="context-menu-new-sheet"
                icon={<MimeIcon name="proton-sheet" className="mr-2" />}
                name={title}
                action={onClick}
                close={close}
            />
        );
    }
};
