import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcLinkSlash } from '@proton/icons/icons/IcLinkSlash';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { CommonButtonProps } from '../../commonButtons/types';

export const StopSharingButton = ({ onClick, close, buttonType }: CommonButtonProps) => {
    const title = c('Action').t`Stop sharing`;

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcLinkSlash alt={title} />}
                onClick={onClick}
                data-testid="toolbar-button-stop-sharing"
            />
        );
    }

    return (
        <ContextMenuButton
            name={title}
            icon={<IcLinkSlash />}
            testId="context-menu-stop-sharing"
            action={onClick}
            close={close}
        />
    );
};
