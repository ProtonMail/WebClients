import { replaceUrl } from '@proton/shared/lib/helpers/browser';

import { getUrlPassword } from '../../utils/url/password';
import { useBookmarks } from '../_bookmarks/useBookmarks';
import { getSharedLink } from '../_shares';

export const useBookmarksView = () => {
    const { addBookmark } = useBookmarks();

    const handleAddBookmark = async (abortSignal: AbortSignal, token: string) => {
        const expectedLength = 10;
        const validPattern = /^[a-zA-Z0-9]+$/;
        // Saved in localStorage
        const urlPassword = getUrlPassword({ readOnly: true });
        // Validate the length + verify pattern
        if (token.length !== expectedLength || !validPattern.test(token) || !urlPassword) {
            return;
        }
        await addBookmark(abortSignal, { urlPassword, token });
    };

    const redirectToPublicPage = (token: string) => {
        const urlPassword = getUrlPassword({ readOnly: true });
        if (!urlPassword) {
            return;
        }
        const url = getSharedLink({ token, password: urlPassword });
        if (!url) {
            return;
        }
        replaceUrl(url);
    };

    return {
        addBookmark: handleAddBookmark,
        redirectToPublicPage,
    };
};
