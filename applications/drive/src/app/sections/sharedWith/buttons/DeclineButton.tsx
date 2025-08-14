import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import type { useConfirmActionModal } from '@proton/components';
import { NodeType } from '@proton/drive';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import useVolumesState from '../../../store/_volumes/useVolumesState';
import { useInvitationsActions } from '../hooks/useInvitationsActions';
import { useLegacyInvitationsActions } from '../legacy/useLegacyInvitationsActions';

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
    // TODO: Remove that when we will have sdk for upload
    const { setVolumeShareIds } = useVolumesState();
    const { rejectInvitation } = useInvitationsActions({ setVolumeShareIds });
    const { rejectLegacyInvitation } = useLegacyInvitationsActions();

    const handleDecline = () => {
        if (type === NodeType.Album) {
            void rejectLegacyInvitation(showConfirmModal, { uid: nodeUid, invitationUid });
        } else {
            void rejectInvitation(showConfirmModal, { uid: nodeUid, invitationUid, name, type });
        }
    };

    if (buttonType === 'toolbar') {
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
