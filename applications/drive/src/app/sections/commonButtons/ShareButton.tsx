import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';
import clsx from '@proton/utils/clsx';

import { ContextMenuButton } from '../../components/sections/ContextMenu';
import type { CommonButtonProps } from './types';

interface ContextMenuProps {
    showTitle?: never;
}

interface ToolbarProps {
    showTitle?: boolean;
}

type Props = ContextMenuProps | ToolbarProps;

export const ShareButton = ({ buttonType, close, onClick, showTitle }: Props & CommonButtonProps) => {
    const title = c('Action').t`Share`;
    const icon = 'user-plus';

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                className={clsx(showTitle && 'inline-flex gap-2')}
                title={title}
                icon={<IcUserPlus alt={title} />}
                onClick={onClick}
                data-testid="toolbar-share-link"
            >
                {showTitle ? title : undefined}
            </ToolbarButton>
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={icon}
                testId="context-menu-share"
                action={onClick}
                close={() => close?.()}
            />
        );
    }
};
