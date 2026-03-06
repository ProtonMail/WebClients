import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcArrowsCross } from '@proton/icons/icons/IcArrowsCross';

import { ContextMenuButton } from '../../components/sections/ContextMenu';

interface BaseProps {
    onClick: () => void;
}

interface ContextMenuProps extends BaseProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarProps extends BaseProps {
    buttonType: 'toolbar';
    close?: never;
}

type Props = ContextMenuProps | ToolbarProps;

export const MoveButton = ({ buttonType, close, onClick }: Props) => {
    const title = c('Action').t`Move to folder`;

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcArrowsCross alt={title} />}
                onClick={onClick}
                data-testid="toolbar-move"
            />
        );
    }
    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={'arrows-cross'}
                testId="context-menu-move"
                action={onClick}
                close={() => close?.()}
            />
        );
    }
};
