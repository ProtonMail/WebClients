import { useEffect } from 'react';

import { useUser } from '@proton/account/user/hooks';
import type { ModalProps } from '@proton/components';
import { useActiveBreakpoint, useModalTwoStatic } from '@proton/components';
import useLocalState from '@proton/components/hooks/useLocalState';
import { useLoading } from '@proton/hooks';
import { useFlag } from '@proton/unleash/useFlag';

import { withHoc } from '../../hooks/withHoc';
import { loadAllAlbums } from '../../photos/loaders/loadAlbums';
import { useAlbumsStore } from '../../photos/useAlbums.store';
import { AlbumOnboardingModalView, type AlbumOnboardingModalViewProps } from './AlbumOnboardingModalView';
import { useAlbumOnboardingModalState } from './useAlbumOnboardingModalState';

export const AlbumOnboardingModal = withHoc<ModalProps, AlbumOnboardingModalViewProps>(
    useAlbumOnboardingModalState,
    AlbumOnboardingModalView
);

const LS_KEY = 'modal_album_onboarding_shown';

// Conditionally shows the modal depending on multiple gating conditions
export const useAlbumOnboardingModal = () => {
    const [render, show] = useModalTwoStatic(AlbumOnboardingModal);
    const isFlagEnabled = useFlag('DriveAlbumOnboardingModal');
    const [alreadyShown, setAlreadyShown] = useLocalState(false, LS_KEY);
    const albums = useAlbumsStore((state) => state.albums);
    const [isLoading, withLoading] = useLoading(true);

    const { viewportWidth } = useActiveBreakpoint();
    const isSmallViewport = viewportWidth['<=small'];

    const [user] = useUser();
    const now = Date.now() / 1000;
    const accountAgeInDays = Math.round((now - user.CreateTime) / 3600 / 24);
    const userForLessThanSevenDays = accountAgeInDays < 7;

    const allChecksPass = isFlagEnabled && !isSmallViewport && !userForLessThanSevenDays && !alreadyShown;
    const showModal = allChecksPass && !isLoading && !albums?.size;

    useEffect(() => {
        if (!allChecksPass) {
            return;
        }
        const abortController = new AbortController();
        void withLoading(loadAllAlbums(abortController.signal));

        return () => {
            abortController.abort();
        };
        // not adding withLoading and loadAlbums to avoid infinite rerender
    }, [allChecksPass]);

    useEffect(() => {
        if (showModal) {
            show({});
            setAlreadyShown(true);
        }
    }, [showModal, show]);

    return { albumOnboardingModal: render, showAlbumOnboardingModal: show };
};
