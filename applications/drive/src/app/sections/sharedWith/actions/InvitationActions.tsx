import type { useConfirmActionModal } from '@proton/components';

import type { InvitationItem } from '../../../zustand/sections/sharedWithMeListing.store';
import { AcceptButton } from '../buttons/AcceptButton';
import { DeclineButton } from '../buttons/DeclineButton';
import { createItemChecker } from './actionsItemsChecker';

interface BaseInvitationActionsProps {
    selectedInvitations: InvitationItem[];
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

interface ContextMenuInvitationActionsProps extends BaseInvitationActionsProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarInvitationActionsProps extends BaseInvitationActionsProps {
    buttonType: 'toolbar';
    close?: never;
}

type InvitationActionsProps = ContextMenuInvitationActionsProps | ToolbarInvitationActionsProps;

export const InvitationActions = ({
    selectedInvitations,
    showConfirmModal,
    close,
    buttonType,
}: InvitationActionsProps) => {
    const itemChecker = createItemChecker(selectedInvitations);

    if (!itemChecker.isOnlyOneItem) {
        return null;
    }

    const invitation = selectedInvitations.at(0);
    if (!invitation) {
        return null;
    }

    return (
        <>
            <AcceptButton
                nodeUid={invitation.nodeUid}
                invitationUid={invitation.invitation.uid}
                type={invitation.type}
                {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
            />
            <DeclineButton
                nodeUid={invitation.nodeUid}
                invitationUid={invitation.invitation.uid}
                type={invitation.type}
                name={invitation.name}
                showConfirmModal={showConfirmModal}
                {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
            />
        </>
    );
};
