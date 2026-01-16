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

export const PreviewButton = ({ buttonType, close, onClick }: Props) => {
    const title = c('Action').t`Preview`;
    const icon = 'eye';

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={onClick}
                data-testid="toolbar-preview"
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={icon}
                testId="context-menu-preview"
                action={onClick}
                close={() => close?.()}
            />
        );
    }
};
