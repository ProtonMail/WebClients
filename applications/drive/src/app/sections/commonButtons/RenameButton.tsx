import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

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

export const RenameButton = ({ buttonType, close, onClick }: Props) => {
    const title = c('Action').t`Rename`;
    const icon = 'pen-square';

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={onClick}
                data-testid="toolbar-rename"
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={icon}
                testId="context-menu-rename"
                action={onClick}
                close={() => close?.()}
            />
        );
    }
};
