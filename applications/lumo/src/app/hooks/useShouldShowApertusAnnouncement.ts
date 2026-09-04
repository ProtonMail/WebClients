import { useCallback, useState } from 'react';

import { isMobile } from '@proton/shared/lib/helpers/browser';

import {
    hasDismissedApertusAnnouncement,
    markApertusAnnouncementDismissed,
} from '../util/apertusAnnouncementStorage';
import { getApertusOnboardingAcceptedAt } from '../util/apertusOnboardingStorage';
import { isSwissTimezone } from '../util/timezone';
import { useIsLumoSmallScreen } from './useIsLumoSmallScreen';
import { useLumoFlags } from './useLumoFlags';
import { useLumoUserSettings } from './useLumoUserSettings';

export const useShouldShowApertusAnnouncement = () => {
    const { isSmallScreen } = useIsLumoSmallScreen();
    const { apertusModelAvailable } = useLumoFlags();
    const { lumoUserSettings } = useLumoUserSettings();
    const [dismissed, setDismissed] = useState(hasDismissedApertusAnnouncement);
    const hasAcceptedApertus = Boolean(
        lumoUserSettings.apertusOnboardingAcceptedAt || getApertusOnboardingAcceptedAt()
    );

    const dismissApertusAnnouncement = useCallback(() => {
        markApertusAnnouncementDismissed();
        setDismissed(true);
    }, []);

    return {
        shouldShowApertusAnnouncement:
            apertusModelAvailable &&
            isSwissTimezone() &&
            !isMobile() &&
            !isSmallScreen &&
            !dismissed &&
            !hasAcceptedApertus,
        dismissApertusAnnouncement,
    };
};
