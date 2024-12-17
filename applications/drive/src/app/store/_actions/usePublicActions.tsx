import { c } from 'ttag';

import { type useConfirmActionModal, useNotifications } from '@proton/components';

import { useAnonymousUploadAuthStore } from '../../zustand/upload/anonymous-auth.store';
import { usePublicLinkActions, usePublicLinksListing } from '../_links';
import useLinksState from '../_links/useLinksState';
import { usePublicLinksActions } from '../_links/usePublicLinksActions';
import { usePublicSessionUser } from '../_user';
import { useErrorHandler } from '../_utils';
import useListNotifications from './useListNotifications';

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
    const linksState = useLinksState();
    const { removeUploadTokens } = useAnonymousUploadAuthStore();
    const { user } = usePublicSessionUser();

    const publicLink = usePublicLinkActions();
    const publicLinks = usePublicLinksActions();
    const { createDeletedPublicItemsNotifications } = useListNotifications();
    const createFolder = async (
        abortSignal: AbortSignal,
        token: string,
        parentLinkId: string,
        name: string
    ): Promise<string> => {
        return publicLink
            .createFolder(abortSignal, { token, parentLinkId, name })
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

    const deleteLinks = async (
        abortSignal: AbortSignal,
        {
            token,
            links,
            showConfirmModal,
        }: {
            token: string;
            links: {
                linkId: string;
                parentLinkId: string;
                authorizationToken?: string;
                name: string;
                isFile: boolean;
            }[];
            showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
        }
    ) => {
        const isSingleItem = links.length === 1;
        const item = links[0];

        let title;
        let message;

        if (isSingleItem) {
            // translator: ${item.name} is for a folder or file name.
            title = c('Title').t`Delete ${item.name}?`;
            message = item.isFile
                ? c('Info').t`This action will delete the file you uploaded permanently.`
                : c('Info')
                      .t`This action will delete the folder you uploaded permanently. You cannot delete a folder that contains not owned file.`;
        } else {
            title = c('Title').t`Delete ${links.length} items?`;
            message = c('Info').t`This action will delete the selected items permanently.`;
        }

        void showConfirmModal({
            title,
            submitText: c('Title').t`Delete`,
            message,
            onSubmit: () =>
                publicLinks
                    .deleteLinks(abortSignal, {
                        token,
                        linkIds: links.map((link) => link.linkId),
                        parentLinkId: links[0].parentLinkId,
                    })
                    .then(({ successes, failures }) => {
                        linksState.removeLinksForPublicPage(token, successes);
                        if (!user) {
                            removeUploadTokens(successes);
                        }
                        createDeletedPublicItemsNotifications(
                            links.map((link) => ({ ...link, rootShareId: token })),
                            successes,
                            failures
                        );
                    }),
        });
    };

    return {
        renameLink,
        createFolder,
        deleteLinks,
    };
}
