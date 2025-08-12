import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { MimeIcon } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { type FolderButtonProps } from './types';

export const CreateNewDocumentButton = ({ type, close, onClick }: FolderButtonProps) => {
    const title = c('Action').t`New document`;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                data-testid="toolbar-new-document"
                icon={<MimeIcon name="proton-doc" />}
                title={title}
                onClick={onClick}
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                testId="context-menu-new-document"
                icon={<MimeIcon name="proton-doc" className="mr-2" />}
                name={title}
                action={onClick}
                close={close}
            />
        );
    }
};
