import { useCallback, useMemo, useState } from 'react';

import { useConfirmActionModal } from '@proton/components';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import { useInvitationsActions } from '../../store/_actions/useInvitationsActions';
import type { ExtendedInvitationDetails } from '../../store/_invitations/interface';
import { useInvitationsView } from '../../store/_views/useInvitationsView';
import type { NodeMeta, PublicNodeMeta } from '../NodeMeta';
import { useDriveCompat } from '../useDriveCompat';

export const useDocInvites = () => {
    const { invitations, isLoading } = useInvitationsView();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const [recentlyAcceptedInvites, setRecentlyAcceptedInvites] = useState<ExtendedInvitationDetails[]>([]);
    const driveCompat = useDriveCompat();

    const docsInvites = useMemo(
        () => invitations.filter((invite) => isProtonDocument(invite.link.mimeType)),
        [invitations]
    );

    const { acceptInvitation, rejectInvitation } = useInvitationsActions();

    const inviteForNodeMeta = useCallback(
        (nodeMeta: NodeMeta | PublicNodeMeta) => {
            return docsInvites.find((invite) => invite.link.linkId === nodeMeta.linkId);
        },
        [docsInvites]
    );

    const acceptInvite = useCallback(
        async (invitation: ExtendedInvitationDetails) => {
            return acceptInvitation(new AbortController().signal, invitation.invitation.invitationId).then((result) => {
                setRecentlyAcceptedInvites((prev) => [...prev, invitation]);
                return result;
            });
        },
        [acceptInvitation]
    );

    const rejectInvite = useCallback(
        async (invitation: ExtendedInvitationDetails) => {
            return rejectInvitation(new AbortController().signal, {
                showConfirmModal,
                invitationId: invitation.invitation.invitationId,
            });
        },
        [rejectInvitation, showConfirmModal]
    );

    const openInvitedDocument = useCallback(
        (invitation: ExtendedInvitationDetails) => {
            void driveCompat.openDocument({
                volumeId: invitation.share.volumeId,
                linkId: invitation.link.linkId,
            });
        },
        [driveCompat]
    );

    return {
        invitations: docsInvites,
        acceptInvite,
        rejectInvite,
        confirmModal,
        recentlyAcceptedInvites,
        openInvitedDocument,
        showConfirmModal,
        inviteForNodeMeta,
        isLoading,
    };
};
