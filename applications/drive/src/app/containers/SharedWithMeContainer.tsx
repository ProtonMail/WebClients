import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import SharedWithMeView from '../components/sections/SharedWithMe/SharedWithMeView';

const SharedWithMeContainer = () => {
    return (
        <Routes>
            <Route path="" element={<SharedWithMeView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default SharedWithMeContainer;
