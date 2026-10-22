import { c } from 'ttag';

import ToolbarButton from '@proton/components/components/toolbar/ToolbarButton';
import { MimeProtonDoc } from '@proton/file-icons/icons/MimeProtonDoc';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { ActionButtonProps } from '../../buttons/types';

export const CreateNewDocumentButton = ({ type, close, onClick }: ActionButtonProps) => {
    const title = c('Action').t`New document`;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                data-testid="toolbar-new-document"
                icon={<MimeProtonDoc alt={title} />}
                title={title}
                onClick={onClick}
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                testId="context-menu-new-document"
                icon={<MimeProtonDoc />}
                name={title}
                action={onClick}
                close={close}
            />
        );
    }
};
