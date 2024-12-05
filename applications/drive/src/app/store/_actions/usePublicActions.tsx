import { c } from 'ttag';

import { useNotifications } from '@proton/components';

import { usePublicLinkActions, usePublicLinksListing } from '../_links';
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

    const renameLink = async (
        abortSignal: AbortSignal,
        {
            token,
            linkId,
            parentLinkId,
            newName,
        }: {
            token: string;
            linkId: string;
            parentLinkId: string;
            newName: string;
        }
    ) => {
        // translator: ${newName} is for a folder or file name.
        const successNotificationText = c('Notification').t`"${newName}" renamed successfully`;
        // translator: ${newName} is for a folder or file name.
        const failNotificationText = c('Notification').t`"${newName}" failed to be renamed`;

        return publicLink
            .renameLink(abortSignal, { token, linkId, newName })
            .then(async () => {
                await publicLinksListing.loadChildren(abortSignal, token, parentLinkId, false);
                createNotification({
                    text: <span className="text-pre-wrap">{successNotificationText}</span>,
                });
            })
            .catch((e) => {
                showErrorNotification(e, <span className="text-pre-wrap">{failNotificationText}</span>);
                throw e;
            });
    };

    return {
        renameLink,
        createFolder,
    };
}
