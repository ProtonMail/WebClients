import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { CommonButtonProps } from '../../commonButtons/types';

type Props = CommonButtonProps;

export const RenameButton = ({ buttonType, close, onClick }: Props) => {
    const title = c('Action').t`Rename`;

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcPenSquare alt={title} />}
                onClick={onClick}
                data-testid="toolbar-rename"
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={<IcPenSquare />}
                testId="context-menu-rename"
                action={onClick}
                close={close}
            />
        );
    }
};
