import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import { NoAccessView } from '../components/sections/Drive/NoAccessView';

const NoAccessContainer = () => {
    return (
        <Routes>
            <Route path="" element={<NoAccessView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default NoAccessContainer;
