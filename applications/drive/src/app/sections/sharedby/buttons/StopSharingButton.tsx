import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcLinkSlash } from '@proton/icons/icons/IcLinkSlash';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import type { CommonButtonProps } from '../../commonButtons/types';

export const StopSharingButton = ({ onClick, close, buttonType }: CommonButtonProps) => {
    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={c('Action').t`Stop sharing`}
                icon={<IcLinkSlash />}
                onClick={onClick}
                data-testid="toolbar-button-stop-sharing"
            />
        );
    }

    return (
        <ContextMenuButton
            name={c('Action').t`Stop sharing`}
            icon="link-slash"
            testId="context-menu-stop-sharing"
            action={onClick}
            close={close}
        />
    );
};
