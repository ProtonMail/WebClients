import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcTrash } from '@proton/icons/icons/IcTrash';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import type { CommonButtonProps } from '../../commonButtons/types';

type Props = CommonButtonProps;

export const RemoveButton = ({ buttonType, close, onClick }: Props) => {
    const title = c('Action').t`Remove device`;

    if (buttonType === 'toolbar') {
        return <ToolbarButton title={title} icon={<IcTrash />} onClick={onClick} data-testid="toolbar-delete" />;
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton name={title} icon="trash" testId="context-menu-remove" action={onClick} close={close} />
        );
    }
};
