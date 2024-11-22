import { c } from 'ttag';

import { useNotifications } from '@proton/components';

import { usePublicLinksListing } from '../_links';
import usePublicLinkActions from '../_links/usePublicLinkActions';
import { useErrorHandler } from '../_utils';

/**
 * useActions provides actions over links and its results is reported back
 * to user using notifications.
 *
 * {@return {confirmModal}} Only needed for deletePermanently/emptyTrash/stopSharingLinks
 */
export function usePublicActions() {
    const { showErrorNotification } = useErrorHandler();
    const { createNotification } = useNotifications();
    const publicLinksListing = usePublicLinksListing();

    const publicLink = usePublicLinkActions();

    const createFolder = async (
        abortSignal: AbortSignal,
        token: string,
        parentLinkId: string,
        name: string
    ): Promise<string> => {
        return publicLink
            .createFolder(abortSignal, token, parentLinkId, name)
            .then(async (id: string) => {
                await publicLinksListing.loadChildren(abortSignal, token, parentLinkId, false);
                createNotification({
                    text: <span className="text-pre-wrap">{c('Notification').t`"${name}" created successfully`}</span>,
                });
                return id;
            })
            .catch((e) => {
                showErrorNotification(
                    e,
                    <span className="text-pre-wrap">{c('Notification').t`"${name}" failed to be created`}</span>
                );
                throw e;
            });
    };

    return {
        createFolder,
    };
}
