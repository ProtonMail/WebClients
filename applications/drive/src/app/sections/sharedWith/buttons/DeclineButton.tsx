import { c } from 'ttag';

import type { useConfirmActionModal } from '@proton/components';
import { ToolbarButton } from '@proton/components';
import type { NodeType } from '@proton/drive';
import { IcCross } from '@proton/icons/icons/IcCross';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import { useInvitationsActions } from '../hooks/useInvitationsActions';

interface BaseProps {
    nodeUid: string;
    invitationUid: string;
    name: string;
    type: NodeType;
}

interface ContextMenuProps extends BaseProps {
    buttonType: 'contextMenu';
    close: () => void;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

interface ToolbarProps extends BaseProps {
    buttonType: 'toolbar';
    close?: never;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

type DeclineButtonProps = ContextMenuProps | ToolbarProps;

export const DeclineButton = ({
    nodeUid,
    invitationUid,
    name,
    type,
    showConfirmModal,
    close,
    buttonType,
}: DeclineButtonProps) => {
    const { rejectInvitation } = useInvitationsActions();
    const title = c('Action').t`Decline`;

    const handleDecline = () => {
        void rejectInvitation(showConfirmModal, { uid: nodeUid, invitationUid, name, type });
    };

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcCross alt={title} />}
                onClick={handleDecline}
                data-testid="toolbar-decline-invitation"
            />
        );
    }

    return (
        <ContextMenuButton
            icon={<IcCross />}
            name={title}
            action={handleDecline}
            close={close}
            testId="shared-with-me-decline-invitation"
        />
    );
};
