import { c } from 'ttag';

import type { useConfirmActionModal } from '@proton/components/index';

import { useInvitationsActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    invitationId: string;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
    close: () => void;
}
export const DeclineButton = ({ invitationId, close, showConfirmModal }: Props) => {
    const { rejectInvitation } = useInvitationsActions();
    return (
        <ContextMenuButton
            icon="cross"
            name={c('Action').t`Decline`}
            action={() => rejectInvitation(new AbortController().signal, { showConfirmModal, invitationId })}
            close={close}
            testId="shared-with-me-decline-invitation"
        />
    );
};
