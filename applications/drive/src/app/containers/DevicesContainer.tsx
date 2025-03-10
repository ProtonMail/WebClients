import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import DevicesView from '../components/sections/Devices/DevicesView';

const DevicesContainer = () => {
    return (
        <Routes>
            <Route path="" element={<DevicesView />} />
            <Route path="*" element={<Navigate to="/devices" replace />} />
        </Routes>
    );
};

export default DevicesContainer;
