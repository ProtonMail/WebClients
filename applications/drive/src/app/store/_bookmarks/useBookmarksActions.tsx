import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import { SharedURLFlags } from '@proton/shared/lib/interfaces/drive/sharing';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
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
        openNewTab(url);
    };

    const handleDeleteBookmark = async (
        abortSignal: AbortSignal,
        { token, linkId }: { token: string; linkId: string }
    ) => {
        try {
            // TODO: remove when we will have events for bookmarks
            await deleteBookmark(abortSignal, token);
            linksListing.removeCachedBookmarkLink(token, linkId);
            createNotification({
                type: 'success',
                text: c('Notification').t`This item was succefully removed from your list`,
            });
        } catch (e) {
            createNotification({
                type: 'error',
                text: c('Notification').t`This item was not removed from your list`,
            });
            sendErrorReport(e);
        }
    };

    const handleDeleteBookmarks = async (
        abortSignal: AbortSignal,
        tokensWithLinkId: { token: string; linkId: string }[]
    ) => {
        try {
            for (let { token, linkId } of tokensWithLinkId) {
                await deleteBookmark(abortSignal, token);
                linksListing.removeCachedBookmarkLink(token, linkId);
            }
            createNotification({
                type: 'success',
                text: c('Notification').t`All items were succefully removed from your list`,
            });
        } catch (e) {
            createNotification({
                type: 'error',
                text: c('Notification').t`Some items failed to be removed from your list`,
            });
            sendErrorReport(e);
        }
    };

    return {
        openBookmark: handleOpenBookmark,
        deleteBookmark: handleDeleteBookmark,
        deleteBookmarks: handleDeleteBookmarks,
    };
};
