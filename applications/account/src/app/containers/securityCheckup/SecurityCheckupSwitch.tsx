import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { SafetyReviewOrRedirect } from '@proton/account/safetyReview/components/SafetyReviewOrRedirect';
import { getSafetyReviewBackLink } from '@proton/account/safetyReview/components/getSafetyReviewBackLink';
import { useFlagsStatus } from '@proton/unleash/proxy';
import { useFlag } from '@proton/unleash/useFlag';

import AccountLoaderPage from '../../content/AccountLoaderPage';
import SecurityCheckupContainer from './SecurityCheckupContainer';

export const SecurityCheckupSwitch = () => {
    const location = useLocation();
    const { flagsReady } = useFlagsStatus();
    const isRecoverySettingsRedesignEnabled = useFlag('RecoverySettingsRedesign');

    const [{ backLink }] = useState(() => {
        const initialSearchParams = new URLSearchParams(location.search);
        const backLink = getSafetyReviewBackLink(decodeURIComponent(initialSearchParams.get('back') ?? ''));
        return {
            backLink,
        };
    });

    if (!flagsReady) {
        return <AccountLoaderPage />;
    }

    if (isRecoverySettingsRedesignEnabled) {
        return <SafetyReviewOrRedirect backLink={backLink} loaderPage={<AccountLoaderPage />} />;
    }

    return <SecurityCheckupContainer />;
};
