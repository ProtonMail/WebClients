import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcDuplicate } from '@proton/icons/icons/IcDuplicate';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { ActionButtonProps } from '../../buttons/types';

export const CopyButton = ({ type, onClick, close }: ActionButtonProps) => {
    const title = c('Action').t`Make a copy`;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcDuplicate alt={title} />}
                onClick={onClick}
                data-testid="toolbar-copy"
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                name={title}
                icon={<IcDuplicate />}
                testId="context-menu-copy"
                action={onClick}
                close={close}
            />
        );
    }
};
