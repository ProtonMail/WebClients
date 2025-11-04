import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { useShallow } from 'zustand/react/shallow';

import { TrashView } from '../sections/trash/TrashView/TrashView';
import { useTrashStore } from '../sections/trash/useTrash.store';

const TrashContainer = () => {
    const TrashComponent = TrashView;
    const { subscribeToEvents, unsubscribeToEvents } = useTrashStore(
        useShallow((state) => ({
            subscribeToEvents: state.subscribeToEvents,
            unsubscribeToEvents: state.unsubscribeToEvents,
        }))
    );

    useEffect(() => {
        void subscribeToEvents('trashContainer');
        return () => {
            void unsubscribeToEvents('trashContainer');
        };
    }, [subscribeToEvents, unsubscribeToEvents]);

    return (
        <Routes>
            <Route path="" element={<TrashComponent />} />
            <Route path="*" element={<Navigate to="/trash" replace />} />
        </Routes>
    );
};

export default TrashContainer;
