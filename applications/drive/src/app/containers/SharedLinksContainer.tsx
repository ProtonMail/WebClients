import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import SharedLinksView from '../components/sections/SharedLinks/SharedLinksView';

const SharedLinksContainer = () => {
    return (
        <Routes>
            <Route path="" element={<SharedLinksView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default SharedLinksContainer;
