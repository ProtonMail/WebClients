import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { TrashView } from '../sections/trash/TrashView/TrashView';
import { subscribeToTrashEvents } from '../sections/trash/subscribeToTrashEvents';

const TrashContainer = () => {
    const TrashComponent = TrashView;

    useEffect(() => {
        const unsubscribe = subscribeToTrashEvents();
        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <Routes>
            <Route path="" element={<TrashComponent />} />
            <Route path="*" element={<Navigate to="/trash" replace />} />
        </Routes>
    );
};

export default TrashContainer;
