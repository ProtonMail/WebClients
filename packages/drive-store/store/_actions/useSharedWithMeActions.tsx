import { c } from 'ttag';

import type { useConfirmActionModal } from '@proton/components/components';
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

    const removeMe = (
        abortSignal: AbortSignal,
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        shareId: string
    ) => {
        showConfirmModal({
            title: c('Title').t`Confirmation required?`,
            message: (
                <>
                    <p>
                        {c('Info')
                            .t`You are about to leave the shared item. You will not be able to access it again until the owner shares it with you.`}
                    </p>
                    <p className="mb-0">{c('Info').t`Are you sure you want to proceed?`}</p>
                </>
            ),
            submitText: c('Action').t`Leave`,
            onSubmit: async () => {
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
            },
            canUndo: true, // Just to hide the undo message
        });
    };

    return {
        removeMe,
    };
};
