import { useCallback } from 'react';

import { c, msgid } from 'ttag';

import type { useConfirmActionModal } from '@proton/components';
import { useNotifications } from '@proton/components';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { partialPublicViewKey } from '../../hooks/util/usePartialPublicView';
import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';
import { getUrlPassword, getUrlPasswordWithCustomPassword } from '../../utils/url/password';
import { useLinksListing } from '../_links';
import { getSharedLink } from '../_shares';
import { useBookmarks } from './useBookmarks';

export const useBookmarksActions = () => {
    const { createNotification } = useNotifications();
    const linksListing = useLinksListing();
    const { addBookmark, deleteBookmark } = useBookmarks();

    const performAddBookmark = useCallback(
        async ({
            token,
            hideNotifications = false,
            urlPassword,
            abortSignal,
        }: {
            token: string;
            hideNotifications?: boolean;
            urlPassword: string;
            abortSignal: AbortSignal;
        }) => {
            const expectedLength = 10;
            const validPattern = /^[a-zA-Z0-9]+$/;
            // Validate the length + verify pattern
            if (token.length !== expectedLength || !validPattern.test(token)) {
                return;
            }

            try {
                await addBookmark(abortSignal, {
                    urlPassword,
                    token,
                    apiSilence: API_CUSTOM_ERROR_CODES.ALREADY_EXISTS,
                }).catch((e) => {
                    // Because we can only list bookmark while being logged-in
                    // This case will only happend if the user try to bookmark the file he already have while being logged-out
                    // In other case we don't allow saved to drive if you already have the bookmark.
                    if (e?.data?.Code === API_CUSTOM_ERROR_CODES.ALREADY_EXISTS) {
                        return undefined;
                    }
                    throw e;
                });
                if (!hideNotifications) {
                    createNotification({
                        type: 'success',
                        text: c('Notification').t`The item was successfully added to your drive`,
                    });
                }
            } catch (e) {
                createNotification({
                    type: 'error',
                    text: c('Notification').t`The item was not added to your drive`,
                });
                sendErrorReport(e);
            }
        },
        [addBookmark, createNotification]
    );

    const handleAddBookmarkFromPrivateApp = async (
        abortSignal: AbortSignal,
        { token, hideNotifications = false }: { token: string; hideNotifications?: boolean }
    ) => {
        // Saved in localStorage if coming from public Drive client; otherwise could be coming from Docs client
        const urlPassword = getUrlPassword({ readOnly: true });
        if (urlPassword) {
            await performAddBookmark({ token, hideNotifications, urlPassword, abortSignal });
        }
    };

    const handleOpenBookmark = async ({ token, urlPassword }: { token: string; urlPassword: string }) => {
        const password = getUrlPasswordWithCustomPassword(urlPassword);
        const url = getSharedLink({ token, password });
        if (!url) {
            throw new EnrichedError(
                "Can't open saved public link",
                {
                    tags: {
                        token,
                        urlPassword,
                    },
                },
                "Can't get url"
            );
        }
        countActionWithTelemetry(Actions.OpenPublicLinkFromSharedWithMe);
        const urlToOpen = new URL(url);
        urlToOpen.searchParams.append(partialPublicViewKey, 'true');
        window.location.assign(urlToOpen.toString());
    };

    const deleteBookmarks = async (abortSignal: AbortSignal, tokensWithLinkId: { token: string; linkId: string }[]) => {
        try {
            for (const { token, linkId } of tokensWithLinkId) {
                await deleteBookmark(abortSignal, token);
                linksListing.removeCachedBookmarkLink(token, linkId);
            }
            countActionWithTelemetry(Actions.DeleteBookmarkFromSharedWithMe, tokensWithLinkId.length);
            createNotification({
                type: 'success',
                text: c('Notification').ngettext(
                    msgid`This item was successfully removed from your list`,
                    `All items were successfully removed from your list`,
                    tokensWithLinkId.length
                ),
            });
        } catch (e) {
            createNotification({
                type: 'error',
                text: c('Notification').ngettext(
                    msgid`This item was not removed from your list`,
                    `Some items failed to be removed from your list`,
                    tokensWithLinkId.length
                ),
            });
            sendErrorReport(e);
        }
    };

    const handleDeleteBookmarks = async (
        abortSignal: AbortSignal,
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        tokensWithLinkId: { token: string; linkId: string }[]
    ) => {
        showConfirmModal({
            title: c('Title').ngettext(
                msgid`Are you sure you want to remove this item from your list?`,
                `Are you sure you want to remove those items from your list?`,
                tokensWithLinkId.length
            ),
            message: c('Info').ngettext(
                msgid`You will need to save it again from the public link page.`,
                `You will need to save them again from the public link page.`,
                tokensWithLinkId.length
            ),
            submitText: c('Action').t`Confirm`,
            onSubmit: () => deleteBookmarks(abortSignal, tokensWithLinkId),
            canUndo: true, // Just to hide the undo message
        });
    };

    const handleDeleteBookmark = async (
        abortSignal: AbortSignal,
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        tokenWithLinkId: { token: string; linkId: string }
    ) => handleDeleteBookmarks(abortSignal, showConfirmModal, [tokenWithLinkId]);

    return {
        addBookmarkFromPrivateApp: handleAddBookmarkFromPrivateApp,
        openBookmark: handleOpenBookmark,
        deleteBookmark: handleDeleteBookmark,
        deleteBookmarks: handleDeleteBookmarks,
    };
};
