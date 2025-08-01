import { Navigate, Route, Routes } from 'react-router-dom-v5-compat';

import useFlag from '@proton/unleash/useFlag';

import SharedLinksView from '../components/sections/SharedLinks/SharedLinksView';
import { SharedByMeView } from '../sections/sharedby/SharedByMeView';

const SharedLinksContainer = () => {
    const shouldUseSDK = useFlag('DriveWebSDKSharedByMe');
    const SharedByMeComponent = shouldUseSDK ? SharedByMeView : SharedLinksView;

    return (
        <Routes>
            <Route path="" element={<SharedByMeComponent />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default SharedLinksContainer;
