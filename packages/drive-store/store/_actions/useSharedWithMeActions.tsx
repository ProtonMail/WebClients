import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';

import useLinksState from '../_links/useLinksState';
import { getSharedWithMeMembership, useShare, useShareMember } from '../_shares';
import { useErrorHandler } from '../_utils';

export const useSharedWithMeActions = () => {
    const { getShareWithKey } = useShare();
    const { removeShareMember } = useShareMember();
    const { createNotification } = useNotifications();
    const { showErrorNotification } = useErrorHandler();
    const linksState = useLinksState();

    const removeMe = async (abortSignal: AbortSignal, shareId: string) => {
        try {
            const share = await getShareWithKey(abortSignal, shareId);

            const membership = getSharedWithMeMembership(share.shareId, share.memberships);

            await removeShareMember(abortSignal, {
                memberId: membership.memberId,
                shareId,
            });
            // TODO: Remove this when events or refactor will be in place
            linksState.removeLinkForSharedWithMe(share.shareId, share.rootLinkId);
            createNotification({
                text: c('Notification').t`File removed`,
            });
        } catch (e) {
            showErrorNotification(e, c('Notification').t`Failed to remove the file`);
            throw e;
        }
    };

    return {
        removeMe,
    };
};
