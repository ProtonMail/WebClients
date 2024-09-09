import { c, msgid } from 'ttag';

import type { useConfirmActionModal } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { SharedURLFlags } from '@proton/shared/lib/interfaces/drive/sharing';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';
import { useLinksListing } from '../_links';
import { getSharedLink, splitGeneratedAndCustomPassword } from '../_shares';
import { useBookmarks } from './useBookmarks';

export const useBookmarksActions = () => {
    const { createNotification } = useNotifications();
    const linksListing = useLinksListing();
    const { deleteBookmark } = useBookmarks();

    const handleOpenBookmark = async ({ token, urlPassword }: { token: string; urlPassword: string }) => {
        // Since we can have custom password in urlPassword we retrieve the generated password from it to open link without it
        // We can force type 2 of flags as we hide bookmarking feature to legacy shared url pages
        const [password] = splitGeneratedAndCustomPassword(urlPassword, {
            flags: SharedURLFlags.GeneratedPasswordWithCustom,
        });
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
        openNewTab(url);
    };

    const deleteBookmarks = async (abortSignal: AbortSignal, tokensWithLinkId: { token: string; linkId: string }[]) => {
        for (let { token, linkId } of tokensWithLinkId) {
            await deleteBookmark(abortSignal, token);
            linksListing.removeCachedBookmarkLink(token, linkId);
        }
        countActionWithTelemetry(Actions.DeleteBookmarkFromSharedWithMe, tokensWithLinkId.length);
    };

    const handleDeleteBookmarks = async (
        abortSignal: AbortSignal,
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        tokensWithLinkId: { token: string; linkId: string }[]
    ) => {
        try {
            showConfirmModal({
                title: c('Title').ngettext(
                    msgid`Are you sure you want to remove this item from your list?`,
                    `Are you sure you want to remove those items from your list?`,
                    tokensWithLinkId.length
                ),
                message: c('Info').ngettext(
                    msgid`You will need to save it again from the public link page.`,
                    `You will need to save them again from the public link page`,
                    tokensWithLinkId.length
                ),
                submitText: c('Action').t`Confirm`,
                onSubmit: () => deleteBookmarks(abortSignal, tokensWithLinkId),
                canUndo: true, // Just to hide the undo message
            });

            createNotification({
                type: 'success',
                text: c('Notification').ngettext(
                    msgid`This item was succefully removed from your list`,
                    `All items were succefully removed from your list`,
                    tokensWithLinkId.length
                ),
            });
        } catch (e) {
            createNotification({
                type: 'success',
                text: c('Notification').ngettext(
                    msgid`This item was not removed from your list`,
                    `Some items failed to be removed from your list`,
                    tokensWithLinkId.length
                ),
            });
            sendErrorReport(e);
        }
    };

    const handleDeleteBookmark = async (
        abortSignal: AbortSignal,
        showConfirmModal: ReturnType<typeof useConfirmActionModal>[1],
        tokenWithLinkId: { token: string; linkId: string }
    ) => handleDeleteBookmarks(abortSignal, showConfirmModal, [tokenWithLinkId]);

    return {
        openBookmark: handleOpenBookmark,
        deleteBookmark: handleDeleteBookmark,
        deleteBookmarks: handleDeleteBookmarks,
    };
};
