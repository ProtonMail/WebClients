import { useCallback } from 'react';

import { useApi } from '@proton/components';
import { NodeType, generateInvitationUid, generateNodeUid } from '@proton/drive';
import { queryUserLinkAccess } from '@proton/shared/lib/api/drive/link';

import { useInvitationsActions } from '../../sections/sharedWith/hooks/useInvitationsActions';
import { useVolumesState } from '../../store/_volumes';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';
import useDriveNavigation from './useNavigate';

/**
 * useLegacyContextShareHandler is a temporary sdk transition hook that match useContextShareHandler legacy file
 * This hook is intended to be deleted once we will migrate the whole sdk
 * @deprecated
 */
export function useLegacyContextShareHandler() {
    const { setVolumeShareIds } = useVolumesState();
    const { navigateToLink, navigateToNoAccess } = useDriveNavigation();
    const { acceptInvitation } = useInvitationsActions({ setVolumeShareIds });
    const api = useApi();

    const handleContextShare = useCallback(
        async (
            abortSignal: AbortSignal,
            { shareId, linkId, type }: { shareId: string; linkId: string; type: NodeType }
        ) => {
            const response = await api<{
                Code: number;
                ContextShare?: {
                    ShareID: string;
                    LinkID: string;
                    VolumeID: string;
                };
                Invitations?: {
                    ShareID: string;
                    VolumeID: string;
                    InvitationID: string;
                }[];
            }>({ ...queryUserLinkAccess({ shareId, linkId }), abortSignal });

            const isFile = type === NodeType.File || type === NodeType.Photo;
            if (!!response.ContextShare) {
                void countActionWithTelemetry(Actions.RedirectToCorrectContextShare);
                return navigateToLink(
                    response.ContextShare.ShareID,
                    linkId,
                    isFile,
                    // return url is used for Preview to know where to go after user close the modal preview
                    isFile ? '/shared-with-me' : undefined
                );
            }

            if (!!response.Invitations?.length) {
                void countActionWithTelemetry(Actions.RedirectToCorrectAcceptInvitation);
                const invitation = response.Invitations[0];
                const uid = generateNodeUid(invitation.VolumeID, linkId);
                const invitationUid = generateInvitationUid(invitation.ShareID, invitation.InvitationID);
                await acceptInvitation(uid, invitationUid, type);
                navigateToLink(
                    invitation.ShareID,
                    linkId,
                    isFile,
                    // return url is used for Preview to know where to go after user close the modal preview
                    isFile ? '/shared-with-me' : undefined
                );
                return;
            }

            navigateToNoAccess();
            return;
        },
        [acceptInvitation, api, navigateToLink, navigateToNoAccess]
    );

    return { handleContextShare };
}
