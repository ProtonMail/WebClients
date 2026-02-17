import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcFolder } from '@proton/icons/icons/IcFolder';

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

export const GoToButton = ({ buttonType, close, onClick }: Props) => {
    const title = c('Action').t`Go to parent`;
    const dataTestId = 'context-menu-go-to-parent';

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton title={title} icon={<IcFolder alt={title} />} onClick={onClick} data-testid={dataTestId} />
        );
    }
    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={'folder'}
                testId={dataTestId}
                action={onClick}
                close={() => close?.()}
            />
        );
    }
};
