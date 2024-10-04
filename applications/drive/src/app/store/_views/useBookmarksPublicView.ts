import { useEffect, useMemo, useState } from 'react';

import { useApi } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import useFlag from '@proton/unleash/useFlag';

import usePublicToken from '../../hooks/drive/usePublicToken';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';
import { useBookmarks } from '../_bookmarks/useBookmarks';
import { usePublicSessionUser } from '../_user';

export interface Props {
    customPassword?: string;
}

export const useBookmarksPublicView = ({ customPassword }: Props) => {
    const { listBookmarks, addBookmark } = useBookmarks();
    const [bookmarksTokens, setBookmarksTokens] = useState<Set<string>>(new Set());
    const bookmarksFeatureDisabled = useFlag('DriveShareURLBookmarksDisabled');
    const [isLoading, withLoading] = useLoading(false);
    const api = useApi();
    const { token, urlPassword } = usePublicToken();
    const { user, UID } = usePublicSessionUser();

    useEffect(() => {
        if (!user || bookmarksFeatureDisabled || !UID) {
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
    }, [user, bookmarksFeatureDisabled, UID]);

    const isAlreadyBookmarked = useMemo(() => {
        return bookmarksTokens.has(token);
    }, [bookmarksTokens, token]);

    const haveBookmarks = useMemo(() => {
        return !!bookmarksTokens.size;
    }, [bookmarksTokens]);

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
        haveBookmarks,
    };
};
