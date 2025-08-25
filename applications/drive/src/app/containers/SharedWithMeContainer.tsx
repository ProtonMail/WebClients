import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { useShallow } from 'zustand/react/shallow';

import useFlag from '@proton/unleash/useFlag';

import { SharedWithMeViewDeprecated } from '../components/sections/SharedWithMe/SharedWithMeView';
import { SharedWithMeView } from '../sections/sharedWith/SharedWithMeView';
import { useInvitationsLoader } from '../sections/sharedWith/loaders/useInvitationsLoader';
import { useLegacyLoader } from '../sections/sharedWith/loaders/useLegacyLoader';
import { useSharedWithMeNodesLoader } from '../sections/sharedWith/loaders/useSharedWithMeNodesLoader';
import { useSharedWithMeListingStore } from '../zustand/sections/sharedWithMeListing.store';

const SharedWithMeContainer = () => {
    const shouldUseSDK = useFlag('DriveWebSDKSharedWithMe');

    const SharedWithMeComponent = shouldUseSDK ? SharedWithMeView : SharedWithMeViewDeprecated;

    const { subscribeToEvents, unsubscribeToEvents } = useSharedWithMeListingStore(
        useShallow((state) => ({
            subscribeToEvents: state.subscribeToEvents,
            unsubscribeToEvents: state.unsubscribeToEvents,
        }))
    );

    const { loadSharedWithMeNodes } = useSharedWithMeNodesLoader();
    const { loadInvitations } = useInvitationsLoader();
    const { loadLegacySharedWithMeAlbums, loadLegacyInvitations } = useLegacyLoader();

    useEffect(() => {
        if (!shouldUseSDK) {
            return;
        }
        const abortController = new AbortController();
        void subscribeToEvents('sharedWithMeContainer', {
            onRefreshSharedWithMe: async () => {
                await Promise.all([
                    loadSharedWithMeNodes(abortController.signal),
                    loadInvitations(abortController.signal),
                    loadLegacySharedWithMeAlbums(abortController.signal),
                    loadLegacyInvitations(abortController.signal),
                ]);
            },
        });
        return () => {
            abortController.abort();
            void unsubscribeToEvents('sharedWithMeContainer');
        };
    }, [
        shouldUseSDK,
        subscribeToEvents,
        unsubscribeToEvents,
        loadInvitations,
        loadLegacyInvitations,
        loadLegacySharedWithMeAlbums,
        loadSharedWithMeNodes,
    ]);
    return (
        <Routes>
            <Route path="" element={<SharedWithMeComponent />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default SharedWithMeContainer;
