import { useEffect } from 'react';

import { signoutAction } from '@proton/account/authenticationService';
import { useDispatch } from '@proton/redux-shared-store';

const NoAppsAvailable = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        // In lack of a better UX we just sign the user out. Normally the user shouldn't be able to log in again afterwards.
        dispatch(signoutAction({ clearDeviceRecovery: false }));
    }, []);
    return null;
};

export default NoAppsAvailable;
