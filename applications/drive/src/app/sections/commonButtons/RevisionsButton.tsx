import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';

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

export const RevisionsButton = ({ buttonType, close, onClick }: Props) => {
    const title = c('Action').t`See version history`;
    const dataTestId = 'context-menu-revisions';

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcClockRotateLeft alt={title} />}
                onClick={onClick}
                data-testid={dataTestId}
            />
        );
    }
    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={'clock-rotate-left'}
                testId={dataTestId}
                action={onClick}
                close={() => close?.()}
            />
        );
    }
};
