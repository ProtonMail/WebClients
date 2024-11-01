import { queryUserLinkAccess } from '@proton/shared/lib/api/drive/link';

import useNavigate from '../../hooks/drive/useNavigate';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';
import { useInvitationsActions } from '../_actions';
import { useDebouncedRequest } from '../_api';
import { useLink } from '../_links';

export const useContextShareHandler = () => {
    const { navigateToRoot, navigateToLink, navigateToNoAccess } = useNavigate();
    const { acceptInvitation } = useInvitationsActions();
    const debouncedRequest = useDebouncedRequest();
    const { getLink } = useLink();

    const handleContextShare = async (
        abortSignal: AbortSignal,
        { shareId, linkId, isFile }: { shareId: string; linkId: string; isFile: boolean }
    ) => {
        const response = await debouncedRequest<{
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
        }>(queryUserLinkAccess({ shareId, linkId }), abortSignal);
        if (!!response.ContextShare) {
            countActionWithTelemetry(Actions.RedirectToCorrectContextShare);
            await getLink(abortSignal, response.ContextShare.ShareID, response.ContextShare.LinkID);
            navigateToLink(response.ContextShare.ShareID, response.ContextShare.LinkID, isFile, '/shared-with-me');
            return;
        }
        if (!!response.Invitations?.length) {
            countActionWithTelemetry(Actions.RedirectToCorrectAcceptInvitation);
            const invitation = response.Invitations[0];
            const acceptedInvitation = await acceptInvitation(abortSignal, invitation.InvitationID);
            // No invitation found, this should not happend as we get it from context
            if (!acceptedInvitation) {
                navigateToRoot();
                return;
            }
            navigateToLink(acceptedInvitation.shareId, acceptedInvitation.linkId, isFile, '/shared-with-me');
            return;
        }
        navigateToNoAccess();
        return;
    };

    return { handleContextShare };
};
