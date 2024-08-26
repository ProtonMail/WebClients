import { useEffect, useState } from 'react';

import useLoading from '@proton/hooks/useLoading';

import type { Bookmark } from '../_bookmarks';
import { useBookmarks } from '../_bookmarks/useBookmarks';

export const useBookmarksView = () => {
    const { listBookmarks, deleteBookmark } = useBookmarks();
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [isLoading, withLoading] = useLoading();

    useEffect(() => {
        const abortControler = new AbortController();
        void withLoading(async () => {
            const newBookmarks = await listBookmarks(abortControler.signal);
            setBookmarks(newBookmarks);
        });
        return () => {
            abortControler.abort();
        };
    }, []);

    const handleDeleteBookmark = async (token: string) => {
        const abortSignal = new AbortController().signal;
        await deleteBookmark(abortSignal, token);
        await listBookmarks(abortSignal);
    };

    return {
        isLoading,
        bookmarks,
        deleteBookmark: handleDeleteBookmark,
    };
};
