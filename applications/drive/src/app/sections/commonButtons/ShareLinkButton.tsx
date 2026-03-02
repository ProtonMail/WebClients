import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';

import { ContextMenuButton } from '../../components/sections/ContextMenu';
import type { CommonButtonProps } from './types';

export const ShareLinkButton = ({ buttonType, onClick, close }: CommonButtonProps) => {
    const title = c('Action').t`Share`;
    const icon = 'user-plus';

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcUserPlus alt={title} />}
                onClick={onClick}
                data-testid="toolbar-share-link"
            />
        );
    }

    if (buttonType === 'contextMenu') {
        return (
            <ContextMenuButton
                name={title}
                icon={icon}
                testId="context-menu-share-link"
                action={onClick}
                close={close}
            />
        );
    }
};
