import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { useShallow } from 'zustand/react/shallow';

import { getDrive, getDriveForPhotos } from '@proton/drive';

import { SharedByMeView } from '../sections/sharedby/SharedByMeView';
import { useSharedByMeNodesLoader } from '../sections/sharedby/loaders/useSharedByMeNodesLoader';
import { useSharedByMeStore } from '../sections/sharedby/useSharedByMe.store';

const SharedLinksContainer = () => {
    const { subscribeToEvents, unsubscribeToEvents } = useSharedByMeStore(
        useShallow((state) => ({
            subscribeToEvents: state.subscribeToEvents,
            unsubscribeToEvents: state.unsubscribeToEvents,
        }))
    );

    const { loadSharedByMeNodes } = useSharedByMeNodesLoader();

    useEffect(() => {
        const abortController = new AbortController();
        void subscribeToEvents('sharedLinksContainer');
        void loadSharedByMeNodes(abortController.signal, getDrive());
        void loadSharedByMeNodes(abortController.signal, getDriveForPhotos());

        return () => {
            abortController.abort();
            void unsubscribeToEvents('sharedLinksContainer');
        };
    }, [subscribeToEvents, unsubscribeToEvents, loadSharedByMeNodes]);

    return (
        <Routes>
            <Route path="" element={<SharedByMeView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default SharedLinksContainer;
