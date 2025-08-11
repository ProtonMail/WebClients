import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import useFlag from '@proton/unleash/useFlag';

import { SharedWithMeViewDeprecated } from '../components/sections/SharedWithMe/SharedWithMeView';
import { SharedWithMeView } from '../sections/sharedWith/SharedWithMeView';

const SharedWithMeContainer = () => {
    const shouldUseSDK = useFlag('DriveWebSDKSharedWithMe');

    const SharedWithMeComponent = shouldUseSDK ? SharedWithMeView : SharedWithMeViewDeprecated;
    return (
        <Routes>
            <Route path="" element={<SharedWithMeComponent />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default SharedWithMeContainer;
