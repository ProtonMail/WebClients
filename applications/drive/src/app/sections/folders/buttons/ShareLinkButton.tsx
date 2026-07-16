import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import type { ActionButtonProps } from '../../buttons/types';

export const ShareLinkButton = ({ onClick, type, close }: ActionButtonProps) => {
    const title = c('Action').t`Share`;

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcUserPlus alt={title} />}
                onClick={onClick}
                data-testid="toolbar-share-link"
            />
        );
    }

    if (type === 'context') {
        return (
            <ContextMenuButton
                name={title}
                icon={<IcUserPlus />}
                testId="context-menu-share-link"
                action={onClick}
                close={close}
            />
        );
    }
};
