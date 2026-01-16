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

export const DetailsButton = ({ buttonType, onClick, close }: Props) => {
    const title = c('Action').t`Details`;
    const icon = 'info-circle';

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={onClick}
                data-testid="toolbar-details"
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton name={title} icon={icon} testId="context-menu-details" action={onClick} close={close} />
        );
    }
};
