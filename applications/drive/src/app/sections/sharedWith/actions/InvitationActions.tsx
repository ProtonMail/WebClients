import type { useConfirmActionModal } from '@proton/components';
import { NodeType } from '@proton/drive/index';

import type { InvitationItem } from '../../../zustand/sections/sharedWithMeListing.store';
import { AcceptButton } from '../buttons/AcceptButton';
import { DeclineButton } from '../buttons/DeclineButton';
import { createItemChecker } from './actionsItemsChecker';

interface BaseInvitationActionsProps {
    selectedInvitations: InvitationItem[];
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

interface ContextMenuInvitationActionsProps extends BaseInvitationActionsProps {
    type: 'contextMenu';
    close: () => void;
}

interface ToolbarInvitationActionsProps extends BaseInvitationActionsProps {
    type: 'toolbar';
    close?: never;
}

type InvitationActionsProps = ContextMenuInvitationActionsProps | ToolbarInvitationActionsProps;

export const InvitationActions = ({ selectedInvitations, showConfirmModal, close, type }: InvitationActionsProps) => {
    const itemChecker = createItemChecker(selectedInvitations);

    if (!itemChecker.isOnlyOneItem) {
        return null;
    }

    const invitation = selectedInvitations.at(0);
    if (!invitation) {
        return null;
    }

    const isAlbum = invitation.type === NodeType.Album;

    return (
        <>
            <AcceptButton
                nodeUid={invitation.nodeUid}
                invitationUid={invitation.invitation.uid}
                isAlbum={isAlbum}
                {...(type === 'contextMenu' ? { close, type } : { type })}
            />
            <DeclineButton
                nodeUid={invitation.nodeUid}
                invitationUid={invitation.invitation.uid}
                isAlbum={isAlbum}
                showConfirmModal={showConfirmModal}
                {...(type === 'contextMenu' ? { close, type } : { type })}
            />
        </>
    );
};
