import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import useFlag from '@proton/unleash/useFlag';

import { TrashViewDepecated } from '../components/sections/Trash/TrashView';
import { TrashView } from '../sections/trash/TrashView/TrashView';

const TrashContainer = () => {
    const shouldUseSDK = useFlag('DriveWebSDKTrash');
    const TrashComponent = shouldUseSDK ? TrashView : TrashViewDepecated;

    return (
        <Routes>
            <Route path="" element={<TrashComponent />} />
            <Route path="*" element={<Navigate to="/trash" replace />} />
        </Routes>
    );
};

export default TrashContainer;
