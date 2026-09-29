import { useCallback, useMemo, useState } from 'react';

import { useConfirmActionModal } from '@proton/components';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import { useInvitationsActions } from '../../store/_actions/useInvitationsActions';
import type { ExtendedInvitationDetails } from '../../store/_invitations/interface';
import { useInvitationsView } from '../../store/_views/useInvitationsView';
import type { NodeMeta, PublicNodeMeta } from '../NodeMeta';

export type DocInvitesHook = () => {
    invitations: ExtendedInvitationDetails[];
    acceptInvite: (
        invitation: ExtendedInvitationDetails
    ) => Promise<{ shareId: string; linkId: string; volumeId: string } | undefined>;
    rejectInvite: (invitation: ExtendedInvitationDetails) => Promise<void>;
    confirmModal: JSX.Element | null;
    recentlyAcceptedInvites: ExtendedInvitationDetails[];
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
    inviteForNodeMeta: (nodeMeta: NodeMeta | PublicNodeMeta) => ExtendedInvitationDetails | undefined;
    isLoading: boolean;
};

export const useDocInvites: DocInvitesHook = () => {
    const { invitations, isLoading } = useInvitationsView();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const [recentlyAcceptedInvites, setRecentlyAcceptedInvites] = useState<ExtendedInvitationDetails[]>([]);

    const docsInvites = useMemo(
        () =>
            invitations.filter(
                (invite) => isProtonDocsDocument(invite.link.mimeType) || isProtonDocsSpreadsheet(invite.link.mimeType)
            ),
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

    return {
        invitations: docsInvites,
        acceptInvite,
        rejectInvite,
        confirmModal,
        recentlyAcceptedInvites,
        showConfirmModal,
        inviteForNodeMeta,
        isLoading,
    };
};
