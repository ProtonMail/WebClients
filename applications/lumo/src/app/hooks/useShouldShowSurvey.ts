import { useCallback, useState } from 'react';

import { isMobile } from '@proton/shared/lib/helpers/browser';
import { localeCode } from '@proton/shared/lib/i18n';

import { useLumoUserType } from '../providers/LumoPlanProvider';
import { hasDismissedNotificationPanel, markNotificationPanelDismissed } from '../util/notificationPanelStorage';
import { useIsLumoSmallScreen } from './useIsLumoSmallScreen';
import { useLumoFlags } from './useLumoFlags';

/**
 * Hook to determine if the survey panel should be shown.
 *
 * Survey shows when ALL conditions are met:
 * 1. Not on mobile or small screen
 * 2. User hasn't dismissed it
 * 3. Appropriate feature flag is enabled for user's tier
 * 4. Locale is English
 */

export const useShouldShowSurvey = () => {
    const { isSmallScreen } = useIsLumoSmallScreen();
    const isMobileOrSmallScreen = isMobile() || isSmallScreen;
    const {
        lumoSurveyFreeUsers: isLumoFreeUsersSurveyEnabled,
        lumoSurveyPaidUsers: isLumoPaidUsersSurveyEnabled,
        lumoSurveyGuestUsers: isLumoGuestUsersSurveyEnabled,
    } = useLumoFlags();
    const { isGuest, isLumoPaid } = useLumoUserType();
    const [notificationDismissed] = useState(hasDismissedNotificationPanel);
    const localeIsEnglish = localeCode === 'en_US';

    let surveyFlagForUserEnabled: boolean;
    if (isGuest) {
        surveyFlagForUserEnabled = isLumoGuestUsersSurveyEnabled;
    } else if (isLumoPaid) {
        surveyFlagForUserEnabled = isLumoPaidUsersSurveyEnabled;
    } else {
        surveyFlagForUserEnabled = isLumoFreeUsersSurveyEnabled;
    }

    const shouldShow = !isMobileOrSmallScreen && surveyFlagForUserEnabled && !notificationDismissed && localeIsEnglish;

    const dismissSurvey = useCallback(() => {
        markNotificationPanelDismissed();
    }, []);

    return {
        shouldShowSurvey: shouldShow,
        surveyFlagEnabled: surveyFlagForUserEnabled,
        isDismissed: notificationDismissed,
        isMobileOrSmallScreen,
        localeIsEnglish,
        dismissSurvey,
    };
};
