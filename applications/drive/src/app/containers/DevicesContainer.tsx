import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import useFlag from '@proton/unleash/useFlag';

import { DevicesViewDeprecated } from '../components/sections/Devices/DevicesView';
import { DevicesView } from '../sections/devices/DevicesView/DevicesView';

const DevicesContainer = () => {
    const shouldUseSdk = useFlag('DriveWebSDKDevices');

    return (
        <Routes>
            <Route path="" element={shouldUseSdk ? <DevicesView /> : <DevicesViewDeprecated />} />
            <Route path="*" element={<Navigate to="/devices" replace />} />
        </Routes>
    );
};

export default DevicesContainer;
