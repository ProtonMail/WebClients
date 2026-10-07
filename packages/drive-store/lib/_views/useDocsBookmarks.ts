import { useEffect, useMemo, useState } from 'react';

import useLoading from '@proton/hooks/useLoading';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { useBookmarks } from '../../store/_bookmarks/useBookmarks';
import { usePublicSessionUser } from '../../store/_user';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';

export interface Props {
    token: string;
    urlPassword: string;
    customPassword?: string;
    // Passed on the Drive SDK path, where usePublicSessionUser has no user. Temporary until bookmarks are migrated to the SDK.
    user?: UserModel;
}

export const useDocsBookmarks = ({ token, urlPassword, customPassword, user: userParam }: Props) => {
    const { listBookmarks, addBookmark } = useBookmarks();
    const [bookmarksTokens, setBookmarksTokens] = useState<Set<string>>(new Set());
    const [isLoading, withLoading] = useLoading(false);

    const { user: sessionUser, UID } = usePublicSessionUser();
    const user = userParam ?? sessionUser;

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
        addBookmark: handleAddBookmark,
        isAlreadyBookmarked,
    };
};
