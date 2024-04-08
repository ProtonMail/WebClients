import { useEffect } from 'react';

import { useDrawer, useFeature, useSpotlightOnFeature, useUser, useWelcomeFlags } from '@proton/components/hooks';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { isUserOlderThan } from '@proton/shared/lib/user/helpers';

import { FeatureCode } from '../features';

const useDesktopSpotlight = () => {
    const [user] = useUser();
    const { setShowDrawerSidebar, setAppInView } = useDrawer();
    const [{ isDone }] = useWelcomeFlags();

    const accountIsOlderThan30Minutes = isUserOlderThan(user, 30);
    const { feature } = useFeature(FeatureCode.SpotlightInboxDesktop);

    /**
     * Display conditions:
     * 30 minutes after account creation for users that didn't log in the desktop app or mobile app
     */
    const displaySpotlight = !isElectronMail && isDone && accountIsOlderThan30Minutes;
    const { show, onDisplayed, onClose } = useSpotlightOnFeature(FeatureCode.SpotlightInboxDesktop, displaySpotlight);

    useEffect(() => {
        if (show) {
            setAppInView(DRAWER_NATIVE_APPS.QUICK_SETTINGS);
            setShowDrawerSidebar(true);
        }
    }, [show]);

    // We mark the spotlight as closed if the user is using the desktop app
    useEffect(() => {
        if (isElectronMail && feature?.Value) {
            onDisplayed();
        }
    }, [isElectronMail, feature]);

    return {
        show,
        onDisplayed,
        onClose,
    };
};

export default useDesktopSpotlight;
