import { c, msgid } from 'ttag';

import { type useConfirmActionModal, useNotifications } from '@proton/components';
import { getPlatformFriendlyDateForFileName } from '@proton/shared/lib/docs/utils/getPlatformFriendlyDateForFileName';

import { useAnonymousUploadAuthStore } from '../../zustand/upload/anonymous-auth.store';
import { usePublicLinkActions, usePublicLinksActions, usePublicLinksListing } from '../_links';
import useLinksState from '../_links/useLinksState';
import { usePublicSessionUser } from '../_user';
import { useErrorHandler } from '../_utils';
import useListNotifications from './useListNotifications';

/**
 * useActions provides actions over links and its results is reported back
 * to user using notifications.
 *
 * {@return {confirmModal}} Only needed for deletePermanently/emptyTrash
 */
export function usePublicActions() {
    const { showErrorNotification } = useErrorHandler();
    const { createNotification } = useNotifications();
    const publicLinksListing = usePublicLinksListing();
    const linksState = useLinksState();
    const removeUploadTokens = useAnonymousUploadAuthStore((state) => state.removeUploadTokens);
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

    const createDocument = async (
        abortSignal: AbortSignal,
        token: string,
        parentLinkId: string,
        documentType: 'doc' | 'sheet' = 'doc'
    ): Promise<string> => {
        const date = getPlatformFriendlyDateForFileName();
        // translator: Default title for a new Proton Document (example: Untitled document 2024-04-23)
        const docName = c('Title').t`Untitled document ${date}`;
        // translator: Default title for a new Proton Spreadsheet (example: Untitled spreadsheet 2024-04-23)
        const sheetName = c('Title').t`Untitled spreadsheet ${date}`;
        const name = documentType === 'sheet' ? sheetName : docName;

        return publicLink
            .createDocument(abortSignal, { token, parentLinkId, name, documentType })
            .then(async (id: string) => {
                await publicLinksListing.loadChildren(abortSignal, token, parentLinkId, false);
                return id;
            })
            .catch((e) => {
                const errorMessage =
                    documentType === 'sheet'
                        ? c('Notification').t`The spreadsheet failed to be created`
                        : c('Notification').t`The document failed to be created`;
                showErrorNotification(e, <span className="text-pre-wrap">{errorMessage}</span>);
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
                volumeId: string;
            }[];
            showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
        }
    ) => {
        const isSingleItem = links.length === 1;
        const { name, isFile } = links[0];

        let title;
        let message;
        if (isSingleItem) {
            // translator: ${name} is for a folder/file/album name.
            title = c('Title').t`Delete ${name}?`;
            message = isFile
                ? c('Info').t`This will permanently delete the file you uploaded.`
                : c('Info').t`This will permanently delete the folder you uploaded.`;
        } else {
            const total = links.length;
            title = c('Title').ngettext(msgid`Delete ${total} item?`, `Delete ${total} items?`, total);
            message = c('Info').t`This will permanently delete the selected items you uploaded.`;
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
                    .then(({ successes, failures, notAllowedErrorCount }) => {
                        linksState.removeLinksForPublicPage(token, successes);
                        if (!user) {
                            removeUploadTokens(successes);
                        }
                        if (!!notAllowedErrorCount) {
                            createNotification({
                                type: 'error',
                                text: c('Notification').ngettext(
                                    msgid`Sorry, we couldn't delete the folder because it is not empty.`,
                                    `Sorry, we couldn't delete the folders because they are not empty.`,
                                    notAllowedErrorCount
                                ),
                            });
                            return;
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
        createDocument,
        deleteLinks,
    };
}
