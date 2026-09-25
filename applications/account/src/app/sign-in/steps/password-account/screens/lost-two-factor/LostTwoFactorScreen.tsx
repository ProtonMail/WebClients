import LoaderPage from '@proton/components/containers/app/LoaderPage';

import { PasswordAccountContext } from '../../PasswordAccountContext';
import { Lost2FAContainer } from './Lost2FAContainer';
import { Lost2FAContext } from './Lost2FAContext';

/** The lost-2FA flow runs as a child of the password account flow; this provides its actor to its screens. */
export const LostTwoFactorScreen = () => {
    const lostTwoFactorRef = PasswordAccountContext.useSelector((snapshot) => snapshot.children.lostTwoFactor);

    // Typed as optional; in practice the flow is spawned with this screen and outlives it
    if (!lostTwoFactorRef) {
        return <LoaderPage />;
    }

    return (
        <Lost2FAContext.Provider value={lostTwoFactorRef}>
            <Lost2FAContainer />
        </Lost2FAContext.Provider>
    );
};
