import { c, msgid } from 'ttag';

import type { useConfirmActionModal } from '@proton/components';
import { useNotifications } from '@proton/components';
import { useDrive } from '@proton/drive/index';

import { partialPublicViewKey } from '../../../hooks/util/usePartialPublicView';
import { getActionEventManager } from '../../../utils/ActionEventManager/ActionEventManager';
import { ActionEventName } from '../../../utils/ActionEventManager/ActionEventManagerTypes';
import { sendErrorReport } from '../../../utils/errorHandling';
import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';

export const useBookmarksActions = () => {
    const { createNotification } = useNotifications();

    const { drive } = useDrive();

    const handleOpenBookmark = async (url: string) => {
        void countActionWithTelemetry(Actions.OpenPublicLinkFromSharedWithMe);
        const urlToOpen = new URL(url);
        urlToOpen.searchParams.append(partialPublicViewKey, 'true');
        window.location.assign(urlToOpen.toString());
    };

    const deleteBookmarksInternal = async (uids: string[]) => {
        let deletedBookmarkUids: string[] = [];

        for (let uid of uids) {
            try {
                await drive.removeBookmark(uid);
                deletedBookmarkUids.push(uid);
            } catch (error) {
                sendErrorReport(error);
            }
        }

        if (deletedBookmarkUids.length > 0) {
            getActionEventManager().emit({
                type: ActionEventName.DELETE_BOOKMARKS,
                uids: deletedBookmarkUids,
            });
            void countActionWithTelemetry(Actions.DeleteBookmarkFromSharedWithMe, deletedBookmarkUids.length);
        }

        if (deletedBookmarkUids.length === uids.length) {
            createNotification({
                type: 'success',
                text: c('Notification').ngettext(
                    msgid`Selected items were successfully removed from your list`,
                    `Selected items were successfully removed from your list`,
                    deletedBookmarkUids.length
                ),
            });
        } else {
            createNotification({
                type: 'error',
                text: c('Notification').ngettext(
                    msgid`Selected item was not removed from your list`,
                    `Selected items failed to be removed from your list`,
                    uids.length
                ),
            });
        }
    };

    const handleDeleteBookmarks = async (
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        uids: string[]
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
            onSubmit: async () => {
                await deleteBookmarksInternal(uids);
            },
            canUndo: true,
        });
    };

    const handleDeleteBookmark = async (showConfirmModal: ReturnType<typeof useConfirmActionModal>[1], uid: string) =>
        handleDeleteBookmarks(showConfirmModal, [uid]);

    return {
        openBookmark: handleOpenBookmark,
        deleteBookmark: handleDeleteBookmark,
        deleteBookmarks: handleDeleteBookmarks,
    };
};
