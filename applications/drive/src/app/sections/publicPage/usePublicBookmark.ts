import { useEffect, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { getDrive } from '@proton/drive';
import useLoading from '@proton/hooks/useLoading';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import useFlag from '@proton/unleash/useFlag';

import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { needPublicRedirectSpotlight, setPublicRedirectSpotlightToPending } from '../../utils/publicRedirectSpotlight';
import { getBookmark } from '../../utils/sdk/getBookmark';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';
import { usePublicAuthStore } from './usePublicAuth.store';
import { getPublicTokenAndPassword } from './utils/getPublicTokenAndPassword';

interface UsePublicBookmarkResult {
    isLoading: boolean;
    isBookmarked: boolean;
    error: boolean;
    addBookmark: (customPassword?: string) => Promise<void>;
    openInDrive: () => void;
    showSaveForLaterSpotlight: boolean;
}

export const usePublicBookmark = (): UsePublicBookmarkResult => {
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [showSaveForLaterSpotlight, setShowSaveFarLaterSpotlight] = useState(false);
    const [isLoading, withLoading] = useLoading(false);
    const bookmarksFeatureDisabled = useFlag('DriveShareURLBookmarksDisabled');
    const { handleError } = useSdkErrorHandler();
    const isLoggedIn = usePublicAuthStore(useShallow((state) => state.isLoggedIn));
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!isLoggedIn || bookmarksFeatureDisabled) {
            return;
        }

        const abortController = new AbortController();

        void withLoading(async () => {
            try {
                for await (const maybeBookmark of getDrive().iterateBookmarks(abortController.signal)) {
                    try {
                        const { bookmark } = getBookmark(maybeBookmark);
                        const { token } = getPublicTokenAndPassword(window.location.pathname);
                        if (bookmark.uid === token) {
                            setIsBookmarked(true);
                            break;
                        }
                    } catch (e) {
                        // Handle gracefully to prevent stopping iterating
                        handleError(e, { showNotification: false });
                        setError(true);
                    }
                }
            } catch (e) {
                setError(true);
                handleError(e);
            }
        });

        if (isLoggedIn && needPublicRedirectSpotlight()) {
            setShowSaveFarLaterSpotlight(true);
        }

        return () => {
            abortController.abort();
        };
    }, [isLoggedIn, bookmarksFeatureDisabled, withLoading, handleError]);

    const handleAddBookmark = async (customPassword?: string) => {
        try {
            await getDrive().createBookmark(window.location.href, customPassword);
            setIsBookmarked(true);
            void countActionWithTelemetry(Actions.AddToBookmark);
            setPublicRedirectSpotlightToPending();
            setShowSaveFarLaterSpotlight(true);
        } catch (error) {
            handleError(error);
        }
    };

    const openInDrive = () => {
        openNewTab(getAppHref('/shared-with-me', APPS.PROTONDRIVE));
    };

    return {
        isLoading,
        error,
        isBookmarked,
        addBookmark: handleAddBookmark,
        openInDrive,
        showSaveForLaterSpotlight,
    };
};
