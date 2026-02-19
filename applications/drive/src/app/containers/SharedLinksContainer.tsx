import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { useShallow } from 'zustand/react/shallow';

import { SharedByMeView } from '../sections/sharedby/SharedByMeView';
import { useSharedByMeStore } from '../sections/sharedby/useSharedByMe.store';

const SharedLinksContainer = () => {
    const { subscribeToEvents, unsubscribeToEvents } = useSharedByMeStore(
        useShallow((state) => ({
            subscribeToEvents: state.subscribeToEvents,
            unsubscribeToEvents: state.unsubscribeToEvents,
        }))
    );

    useEffect(() => {
        const abortController = new AbortController();
        void subscribeToEvents('sharedLinksContainer');

        return () => {
            abortController.abort();
            void unsubscribeToEvents('sharedLinksContainer');
        };
    }, [subscribeToEvents, unsubscribeToEvents]);

    return (
        <Routes>
            <Route path="" element={<SharedByMeView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default SharedLinksContainer;
