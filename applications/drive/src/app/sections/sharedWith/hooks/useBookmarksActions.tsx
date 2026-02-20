import { c, msgid } from 'ttag';

import type { useConfirmActionModal } from '@proton/components';
import { useNotifications } from '@proton/components';
import { useDrive } from '@proton/drive/index';
import { BusDriverEventName, getBusDriver } from '@proton/drive/internal/BusDriver';
import { PROTON_LOCAL_DOMAIN } from '@proton/shared/lib/localDev';

import { partialPublicViewKey } from '../../../hooks/util/usePartialPublicView';
import { sendErrorReport } from '../../../utils/errorHandling';
import { replaceLocalURL } from '../../../utils/replaceLocalURL';
import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';

export const useBookmarksActions = () => {
    const { createNotification } = useNotifications();

    const { drive } = useDrive();

    const handleOpenBookmark = async (url: string) => {
        void countActionWithTelemetry(Actions.OpenPublicLinkFromSharedWithMe);
        // TODO: Remove that part once SDK support all domains
        // It is basically to support local domain on e2e

        const isLocalOrAtlas =
            window.location.host.includes(PROTON_LOCAL_DOMAIN) || window.location.host.endsWith('proton.black');

        const urlToOpen = new URL(replaceLocalURL(url));
        if (isLocalOrAtlas) {
            urlToOpen.host = window.location.host;
        }
        urlToOpen.searchParams.append(partialPublicViewKey, 'true');
        window.location.assign(urlToOpen.toString());
    };

    const deleteBookmarksInternal = async (uids: string[]) => {
        const deletedBookmarkUids: string[] = [];

        for (const uid of uids) {
            try {
                await drive.removeBookmark(uid);
                deletedBookmarkUids.push(uid);
            } catch (error) {
                sendErrorReport(error);
            }
        }

        if (deletedBookmarkUids.length > 0) {
            await getBusDriver().emit({
                type: BusDriverEventName.DELETE_BOOKMARKS,
                uids: deletedBookmarkUids,
            });
            void countActionWithTelemetry(Actions.DeleteBookmarkFromSharedWithMe, deletedBookmarkUids.length);
        }

        if (deletedBookmarkUids.length === uids.length) {
            createNotification({
                type: 'success',
                text: c('Notification').ngettext(
                    msgid`Selected item was successfully removed from your list`,
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
