import { useEffect, useMemo, useState } from 'react';

import useLoading from '@proton/hooks/useLoading';

import { useBookmarks } from '../../store/_bookmarks/useBookmarks';
import { usePublicSessionUser } from '../../store/_user';
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

    const { user, UID } = usePublicSessionUser();

    useEffect(() => {
        if (!user || !UID) {
            return;
        }

        const abortControler = new AbortController();
        void withLoading(async () => {
            const bookmarks = await listBookmarks(abortControler.signal);
            setBookmarksTokens(new Set(bookmarks.map((bookmark) => bookmark.sharedUrlInfo.token)));
        });
        return () => {
            abortControler.abort();
        };
    }, [user, UID]);

    const isAlreadyBookmarked = useMemo(() => {
        return bookmarksTokens.has(token);
    }, [bookmarksTokens, token]);

    const handleAddBookmark = async () => {
        const abortSignal = new AbortController().signal;
        await addBookmark(abortSignal, { token, urlPassword: urlPassword + (customPassword ?? '') });
        setBookmarksTokens((prevState) => new Set([...prevState, token]));
        void countActionWithTelemetry(Actions.AddToBookmark);
    };

    return {
        isLoading,
        customPassword, // We return customPassword to be able to access it easily in the public page
        addBookmark: handleAddBookmark,
        isAlreadyBookmarked,
    };
};
