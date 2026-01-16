import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../components/sections/ContextMenu';

interface BaseProps {
    deletionType: 'delete' | 'trash';
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

export const DeleteButton = ({ buttonType, deletionType, close, onClick }: Props) => {
    const title = deletionType === 'delete' ? c('Action').t`Delete` : c('Action').t`Move to trash`;
    const icon = 'trash';

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={onClick}
                data-testid={`toolbar-${deletionType}`}
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={icon}
                testId={`context-menu-${deletionType}`}
                action={onClick}
                close={() => close?.()}
            />
        );
    }
};
