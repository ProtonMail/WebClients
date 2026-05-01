import {useCallback, useState} from 'react';

import {isMobile} from '@proton/shared/lib/helpers/browser';
import {localeCode} from '@proton/shared/lib/i18n';

import {useLumoUserType} from '../providers/LumoPlanProvider';
import {hasDismissedNotificationPanel, markNotificationPanelDismissed} from '../util/notificationPanelStorage';
import {useIsLumoSmallScreen} from './useIsLumoSmallScreen';
import {useLumoFlags} from './useLumoFlags';

const UK_TIME_ZONES = new Set(['Europe/London', 'Europe/Belfast', 'Europe/Guernsey', 'Europe/Jersey', 'Europe/Isle_of_Man']);

/**
 * Hook to determine if the survey panel should be shown.
 *
 * Survey shows when ALL conditions are met:
 * 1. Not on mobile or small screen
 * 2. User hasn't dismissed it
 * 3. Appropriate feature flag is enabled for user's tier
 * 4. Locale is English
 * 5. Timezone is in the UK
 */

export const useShouldShowSurvey = () => {
    const { isSmallScreen } = useIsLumoSmallScreen();
    const isMobileOrSmallScreen = isMobile() || isSmallScreen;
    const { lumoSurvey: lumoSurvey } = useLumoFlags();
    const { isGuest } = useLumoUserType();
    const [notificationDismissed] = useState(hasDismissedNotificationPanel);
    const localeIsEnglish = localeCode === 'en_US';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneIsUK = UK_TIME_ZONES.has(timeZone);

    const shouldShow =
        !isMobileOrSmallScreen && lumoSurvey && !notificationDismissed && localeIsEnglish && timezoneIsUK && !isGuest;

    const dismissSurvey = useCallback(() => {
        markNotificationPanelDismissed();
    }, []);

    return {
        shouldShowSurvey: shouldShow,
        surveyFlagEnabled: lumoSurvey,
        isDismissed: notificationDismissed,
        isMobileOrSmallScreen,
        localeIsEnglish,
        timezoneIsUK,
        dismissSurvey,
    };
};
