import { c, msgid } from 'ttag';

import type { useConfirmActionModal } from '@proton/components';
import { useNotifications } from '@proton/components';
import { useDrive } from '@proton/drive/index';

import { partialPublicViewKey } from '../../hooks/util/usePartialPublicView';
import { sendErrorReport } from '../../utils/errorHandling';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';

/**
 * TODO: Refactor hooks and store organization
 *
 * We should keep hooks closer to their related stores and UI components rather than
 * separating them. Consider creating section-specific action hooks like
 * useSharedWithMeActions that bundle related state management, actions, and UI logic.
 *
 * For bookmark actions specifically:
 * - Split into useSharedWithMeActions for shared-with-me context
 * - Create separate actions for public page (likely with different SDK)
 * - Design a generic store pattern with zustand that combines stores + actions + notifications
 * - Emit events and process all inputs into store in one-way flow within same module
 *
 * This will make it easier to discover the correct hook to use instead of calling
 * store/SDK directly, and keep related functionality co-located.
 */

export const useBookmarksActions = () => {
    const { createNotification } = useNotifications();

    const { drive } = useDrive();

    const handleOpenBookmark = async (url: string) => {
        countActionWithTelemetry(Actions.OpenPublicLinkFromSharedWithMe);
        const urlToOpen = new URL(url);
        urlToOpen.searchParams.append(partialPublicViewKey, 'true');
        window.location.assign(urlToOpen.toString());
    };

    const deleteBookmarks = async (uids: string[], onDelete?: (uids: string[]) => void) => {
        let deletedBookmarkUids = [];
        try {
            for (let uid of uids) {
                await drive.removeBookmark(uid);
                deletedBookmarkUids.push(uid);
            }
            countActionWithTelemetry(Actions.DeleteBookmarkFromSharedWithMe, uids.length);
            createNotification({
                type: 'success',
                text: c('Notification').ngettext(
                    msgid`This item was successfully removed from your list`,
                    `All items were successfully removed from your list`,
                    uids.length
                ),
            });
        } catch (e) {
            createNotification({
                type: 'error',
                text: c('Notification').ngettext(
                    msgid`This item was not removed from your list`,
                    `Some items failed to be removed from your list`,
                    uids.length
                ),
            });
            sendErrorReport(e);
        } finally {
            onDelete?.(deletedBookmarkUids);
        }
    };

    const handleDeleteBookmarks = async (
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        uids: string[],
        onDelete?: (uids: string[]) => void
    ) => {
        showConfirmModal({
            title: c('Title').ngettext(
                msgid`Are you sure you want to remove this item from your list?`,
                `Are you sure you want to remove those items from your list?`,
                uids.length
            ),
            message: c('Info').ngettext(
                msgid`You will need to save it again from the public link page.`,
                `You will need to save them again from the public link page.`,
                uids.length
            ),
            submitText: c('Action').t`Confirm`,
            onSubmit: () => deleteBookmarks(uids, onDelete),
            canUndo: true, // Just to hide the undo message
        });
    };

    const handleDeleteBookmark = async (
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        uid: string,
        onDelete?: (uid: string) => void
    ) => handleDeleteBookmarks(showConfirmModal, [uid], (uids) => onDelete?.(uids[0]));

    const handleAddBookmarkFromPrivateApp = async () => {
        throw new Error('addBookmarkFromPrivateApp with sdk is not implemented yet');
    };

    return {
        addBookmarkFromPrivateApp: handleAddBookmarkFromPrivateApp,
        openBookmark: handleOpenBookmark,
        deleteBookmark: handleDeleteBookmark,
        deleteBookmarks: handleDeleteBookmarks,
    };
};
