import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { useShallow } from 'zustand/react/shallow';

import useFlag from '@proton/unleash/useFlag';

import SharedLinksView from '../components/sections/SharedLinks/SharedLinksView';
import { SharedByMeView } from '../sections/sharedby/SharedByMeView';
import { useSharedByMeNodesLoader } from '../sections/sharedby/loaders/useSharedByMeNodesLoader';
import { useSharedByMeStore } from '../sections/sharedby/useSharedByMe.store';

const SharedLinksContainer = () => {
    const shouldUseSDK = useFlag('DriveWebSDKSharedByMe');
    const SharedByMeComponent = shouldUseSDK ? SharedByMeView : SharedLinksView;

    const { subscribeToEvents, unsubscribeToEvents } = useSharedByMeStore(
        useShallow((state) => ({
            subscribeToEvents: state.subscribeToEvents,
            unsubscribeToEvents: state.unsubscribeToEvents,
        }))
    );

    const { loadSharedByMeNodes } = useSharedByMeNodesLoader();

    useEffect(() => {
        if (!shouldUseSDK) {
            return;
        }
        const abortController = new AbortController();
        void subscribeToEvents('sharedLinksContainer');
        void loadSharedByMeNodes(abortController.signal);

        return () => {
            abortController.abort();
            void unsubscribeToEvents('sharedLinksContainer');
        };
    }, [shouldUseSDK, subscribeToEvents, unsubscribeToEvents, loadSharedByMeNodes]);

    return (
        <Routes>
            <Route path="" element={<SharedByMeComponent />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default SharedLinksContainer;
