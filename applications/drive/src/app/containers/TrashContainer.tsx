import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { useShallow } from 'zustand/react/shallow';

import useFlag from '@proton/unleash/useFlag';

import { TrashViewDepecated } from '../components/sections/Trash/TrashView';
import { TrashView } from '../sections/trash/TrashView/TrashView';
import { useTrashStore } from '../sections/trash/useTrash.store';

const TrashContainer = () => {
    const shouldUseSDK = useFlag('DriveWebSDKTrash');
    const TrashComponent = shouldUseSDK ? TrashView : TrashViewDepecated;
    const { subscribe, unsubscribe } = useTrashStore(
        useShallow((state) => ({
            subscribe: state.subscribe,
            unsubscribe: state.unsubscribe,
        }))
    );

    useEffect(() => {
        void subscribe('trashContainer');
        return () => {
            void unsubscribe('trashContainer');
        };
    }, [subscribe, unsubscribe]);

    return (
        <Routes>
            <Route path="" element={<TrashComponent />} />
            <Route path="*" element={<Navigate to="/trash" replace />} />
        </Routes>
    );
};

export default TrashContainer;
