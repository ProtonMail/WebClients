import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Icon, ToolbarButton } from '@proton/components';
import type { useConfirmActionModal } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { useInvitationsActions } from '../../../hooks/drive/useInvitationsActions';
import { useInvitationsActions as useLegacyInvitationsActions } from '../../../store';
import { useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';

interface BaseProps {
    nodeUid: string;
    invitationUid: string;
    isAlbum: boolean;
}

interface ContextMenuProps extends BaseProps {
    type: 'contextMenu';
    close: () => void;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

interface ToolbarProps extends BaseProps {
    type: 'toolbar';
    close?: never;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

type DeclineButtonProps = ContextMenuProps | ToolbarProps;

export const DeclineButton = ({
    nodeUid,
    invitationUid,
    isAlbum,
    showConfirmModal,
    close,
    type,
}: DeclineButtonProps) => {
    const { rejectInvitation } = useInvitationsActions();
    const { rejectInvitation: legacyRejectInvitation } = useLegacyInvitationsActions();
    const removeSharedWithMeItemFromStore = useSharedWithMeListingStore(
        useShallow((state) => state.removeSharedWithMeItem)
    );

    const handleDecline = () => {
        if (isAlbum) {
            void legacyRejectInvitation(new AbortController().signal, {
                showConfirmModal,
                invitationId: invitationUid,
                onSuccess: () => {
                    removeSharedWithMeItemFromStore(nodeUid);
                },
            });
        } else {
            void rejectInvitation(showConfirmModal, nodeUid, invitationUid);
        }
    };

    if (type === 'toolbar') {
        return (
            <ToolbarButton
                title={c('Action').t`Decline`}
                icon={<Icon name="cross" alt={c('Action').t`Decline`} />}
                onClick={handleDecline}
                data-testid="toolbar-decline-invitation"
            />
        );
    }

    return (
        <ContextMenuButton
            icon="cross"
            name={c('Action').t`Decline`}
            action={handleDecline}
            close={close}
            testId="shared-with-me-decline-invitation"
        />
    );
};
