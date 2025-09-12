import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { getActionEventManager } from '../../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../../utils/ActionEventManager/ActionEventManagerTypes';

interface BaseProps {
    stopSharing: (shareId: string, onSuccess?: () => void) => void;
    shareId: string;
    uid: string;
    parentUid: string | undefined;
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
export const StopSharingButton = ({ uid, parentUid, shareId, stopSharing, close, buttonType }: Props) => {
    const handleClick = () => {
        stopSharing(shareId, () => {
            void getActionEventManager().emit({
                type: ActionEventName.UPDATED_NODES,
                items: [{ uid, parentUid, isShared: false }],
            });
        });
    };
    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={c('Action').t`Stop sharing`}
                icon={<Icon name="link-slash" />}
                onClick={handleClick}
                data-testid="toolbar-button-stop-sharing"
            />
        );
    }

    return (
        <ContextMenuButton
            name={c('Action').t`Stop sharing`}
            icon="link-slash"
            testId="context-menu-stop-sharing"
            action={handleClick}
            close={close}
        />
    );
};
