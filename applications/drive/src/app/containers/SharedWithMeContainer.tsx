import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { SharedWithMeView } from '../sections/sharedWith/SharedWithMeView';
import { useInvitationsLoader } from '../sections/sharedWith/loaders/useInvitationsLoader';
import { useSharedWithMeNodesLoader } from '../sections/sharedWith/loaders/useSharedWithMeNodesLoader';
import { useSharedWithMeStore } from '../sections/sharedWith/useSharedWithMe.store';

const SharedWithMeContainer = () => {
    const { loadSharedWithMeNodes } = useSharedWithMeNodesLoader();
    const { loadInvitations } = useInvitationsLoader();

    useEffect(() => {
        const abortController = new AbortController();
        void useSharedWithMeStore.getState().subscribeToEvents('sharedWithMeContainer', {
            onRefreshSharedWithMe: async () => {
                await Promise.all([
                    loadSharedWithMeNodes(abortController.signal),
                    loadInvitations(abortController.signal),
                ]);
            },
        });
        return () => {
            abortController.abort();
            void useSharedWithMeStore.getState().unsubscribeToEvents('sharedWithMeContainer');
        };
    }, [loadInvitations, loadSharedWithMeNodes]);
    return (
        <Routes>
            <Route path="" element={<SharedWithMeView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default SharedWithMeContainer;
