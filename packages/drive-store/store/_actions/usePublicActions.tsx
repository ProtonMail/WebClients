import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';

import { usePublicLinkActions } from '../_links/usePublicLinkActions';
import { useErrorHandler } from '../_utils';

/**
 * useActions provides actions over links and its results is reported back
 * to user using notifications.
 *
 * {@return {confirmModal}} Only needed for deletePermanently/emptyTrash
 */
export function usePublicActions() {
    const { showErrorNotification } = useErrorHandler();
    const { createNotification } = useNotifications();

    const publicLink = usePublicLinkActions();

    const renameLink = async (
        abortSignal: AbortSignal,
        {
            token,
            linkId,
            newName,
        }: {
            token: string;
            linkId: string;
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
    };
}
