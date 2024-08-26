import { useEffect, useMemo, useState } from 'react';

import { useApi } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';

import usePublicToken from '../../hooks/drive/usePublicToken';
import { usePublicSession } from '../_api';
import { useDriveShareURLBookmarkingFeatureFlag } from '../_bookmarks';
import { useBookmarks } from '../_bookmarks/useBookmarks';
import { usePublicShare } from '../_shares';

export const useBookmarksPublicView = () => {
    const { user } = usePublicShare();
    const { getSessionInfo } = usePublicSession();
    const { listBookmarks, addBookmark } = useBookmarks();
    const [bookmarksTokens, setBookmarksTokens] = useState<Set<string>>(new Set());
    const [isLoading, withLoading] = useLoading(true);
    const isDriveShareUrlBookmarkingEnabled = useDriveShareURLBookmarkingFeatureFlag();
    const api = useApi();
    const { token, urlPassword } = usePublicToken();

    useEffect(() => {
        if (!user || !isDriveShareUrlBookmarkingEnabled) {
            return;
        }
        const UID = getSessionInfo()?.sessionUid;
        if (!UID) {
            return;
        }
        const abortControler = new AbortController();
        void withLoading(async () => {
            // TODO: We need to find a better way of doing this
            (api as any).UID = UID;

            const bookmarks = await listBookmarks(abortControler.signal);
            setBookmarksTokens(new Set(bookmarks.map((bookmark) => bookmark.token.Token)));
        });
        return () => {
            abortControler.abort();
        };
    }, [user, isDriveShareUrlBookmarkingEnabled]);

    const isAlreadyBookmarked = useMemo(() => {
        return bookmarksTokens.has(token);
    }, [bookmarksTokens, token]);

    const handleAddBookmark = async () => {
        const abortSignal = new AbortController().signal;
        await addBookmark(abortSignal, { token, urlPassword });
        setBookmarksTokens((prevState) => new Set([...prevState, token]));
    };

    return {
        urlPassword,
        isLoading,
        isLoggedIn: !!user,
        addBookmark: handleAddBookmark,
        isAlreadyBookmarked,
    };
};
