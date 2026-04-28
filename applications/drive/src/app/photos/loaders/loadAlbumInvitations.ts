import { NodeType, type ProtonInvitationWithNode, getDriveForPhotos } from '@proton/drive/index';

import { handleSdkError } from '../../utils/errorHandling/handleSdkError';
import { useAlbumInvitationsStore } from '../useAlbumInvitations.store';

export const loadAlbumInvitations = async (abortSignal: AbortSignal): Promise<void> => {
    useAlbumInvitationsStore.getState().setLoading(true);
    try {
        const invitations: ProtonInvitationWithNode[] = [];
        for await (const invitation of getDriveForPhotos().iterateInvitations(abortSignal)) {
            if (invitation.node.type !== NodeType.Album) {
                continue;
            }
            invitations.push(invitation);
        }
        useAlbumInvitationsStore.getState().setInvitations(invitations);
    } catch (e) {
        if ((e as { name?: string })?.name !== 'AbortError') {
            handleSdkError(e);
        }
    } finally {
        useAlbumInvitationsStore.getState().setLoading(false);
    }
};
