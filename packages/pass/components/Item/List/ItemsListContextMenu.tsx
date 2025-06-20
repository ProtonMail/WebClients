import type { RefObject } from 'react';
import { type FC } from 'react';

import { c } from 'ttag';

import ContextMenuButton from '@proton/components/components/contextMenu/ContextMenuButton';
import { ContextMenu } from '@proton/pass/components/ContextMenu/ContextMenu';
import { logger } from '@proton/pass/utils/logger';

type Props = { id: string; anchorRef: RefObject<HTMLElement> };

export const ItemsListContextMenu: FC<Props> = ({ id, anchorRef }) => {
    const handleAction = () => {
        logger.log('Action clicked');
    };

    return (
        <ContextMenu id={id} anchorRef={anchorRef}>
            <ContextMenuButton
                key="context-menu-block"
                testId="context-menu-block"
                icon="circle-slash"
                name={c('Action').t`Test Action`}
                action={handleAction}
            />
        </ContextMenu>
    );
};
