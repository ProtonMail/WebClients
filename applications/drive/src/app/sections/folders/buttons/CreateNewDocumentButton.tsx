import { c } from 'ttag';

import MimeIcon from '@proton/components/components/icon/MimeIcon';
import ToolbarButton from '@proton/components/components/toolbar/ToolbarButton';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { ActionButtonProps } from '../../buttons/types';

export const CreateNewDocumentButton = ({ type, close, onClick }: ActionButtonProps) => {
    const title = c('Action').t`New document`;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                data-testid="toolbar-new-document"
                icon={<MimeIcon name="proton-doc" alt={title} />}
                title={title}
                onClick={onClick}
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                testId="context-menu-new-document"
                icon={<MimeIcon name="proton-doc" />}
                name={title}
                action={onClick}
                close={close}
            />
        );
    }
};
