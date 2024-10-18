import { useEffect, useMemo, useState } from 'react';

import { useApi } from '@proton/components';
import { useDriveShareURLBookmarkingFeatureFlag } from '@proton/drive-store/store/_bookmarks';
import { useBookmarks } from '@proton/drive-store/store/_bookmarks/useBookmarks';
import { usePublicSessionUser } from '@proton/drive-store/store/_user';
import useLoading from '@proton/hooks/useLoading';

import { Actions, countActionWithTelemetry } from '../../utils/telemetry';

export interface Props {
    token: string;
    urlPassword: string;
    customPassword?: string;
}

export const useDocsBookmarks = ({ token, urlPassword, customPassword }: Props) => {
    const { listBookmarks, addBookmark } = useBookmarks();
    const [bookmarksTokens, setBookmarksTokens] = useState<Set<string>>(new Set());
    const [isLoading, withLoading] = useLoading(false);
    const isDriveShareUrlBookmarkingEnabled = useDriveShareURLBookmarkingFeatureFlag();
    const api = useApi();

    const { user, UID } = usePublicSessionUser();

    useEffect(() => {
        if (!user || !isDriveShareUrlBookmarkingEnabled || !UID) {
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isDriveShareUrlBookmarkingEnabled, UID]);

    const isAlreadyBookmarked = useMemo(() => {
        return bookmarksTokens.has(token);
    }, [bookmarksTokens, token]);

    const handleAddBookmark = async () => {
        const abortSignal = new AbortController().signal;
        await addBookmark(abortSignal, { token, urlPassword: urlPassword + (customPassword ?? '') });
        setBookmarksTokens((prevState) => new Set([...prevState, token]));
        countActionWithTelemetry(Actions.AddToBookmark);
    };

    return {
        isLoading,
        customPassword, // We return customPassword to be able to access it easily in the public page
        addBookmark: handleAddBookmark,
        isAlreadyBookmarked,
    };
};
