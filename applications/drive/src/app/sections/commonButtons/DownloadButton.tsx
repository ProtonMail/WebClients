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

export const DownloadButton = ({ buttonType, onClick, close }: Props) => {
    const title = c('Action').t`Download`;
    const icon = 'arrow-down-line';

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<Icon name={icon} alt={title} />}
                onClick={onClick}
                data-testid="toolbar-download"
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton name={title} icon={icon} testId="context-menu-download" action={onClick} close={close} />
        );
    }
};
