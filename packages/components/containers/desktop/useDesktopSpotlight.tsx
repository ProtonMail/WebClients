import { useEffect } from 'react';

import { differenceInDays, fromUnixTime } from 'date-fns';

import { useDrawer, useSpotlightOnFeature, useUser, useWelcomeFlags } from '@proton/components/hooks';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

import { FeatureCode } from '../features';

const useDesktopSpotlight = () => {
    const [user] = useUser();
    const { setShowDrawerSidebar, setAppInView } = useDrawer();
    const [{ isDone }] = useWelcomeFlags();
    const userAccountHasMoreThanThreeDays = differenceInDays(new Date(), fromUnixTime(user.CreateTime)) > 1;

    /**
     * Display conditions:
     * User has done the welcome flow AND User has created his account more than 1 day ago
     * OR the user is a paid user
     */
    const displaySpotlight = (isDone && user.isPaid) || (isDone && userAccountHasMoreThanThreeDays);
    const { show, onDisplayed, onClose } = useSpotlightOnFeature(FeatureCode.SpotlightInboxDesktop, displaySpotlight);

    useEffect(() => {
        if (show) {
            setAppInView(DRAWER_NATIVE_APPS.QUICK_SETTINGS);
            setShowDrawerSidebar(true);
        }
    }, [show]);

    return {
        show,
        onDisplayed,
        onClose,
    };
};

export default useDesktopSpotlight;
