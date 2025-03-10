import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import TrashView from '../components/sections/Trash/TrashView';

const TrashContainer = () => {
    return (
        <Routes>
            <Route path="" element={<TrashView />} />
            <Route path="*" element={<Navigate to="/trash" replace />} />
        </Routes>
    );
};

export default TrashContainer;
