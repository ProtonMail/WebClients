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

    const [{ vParamIsNew, backLink }] = useState(() => {
        const initialSearchParams = new URLSearchParams(location.search);
        const backLink = getSafetyReviewBackLink(decodeURIComponent(initialSearchParams.get('back') ?? ''));
        return {
            vParamIsNew: initialSearchParams.get('v') === 'new',
            backLink,
        };
    });

    if (!flagsReady) {
        return <AccountLoaderPage />;
    }

    const isNewVersion = vParamIsNew || isRecoverySettingsRedesignEnabled;
    const isEmailSource = location.pathname.includes('safety-review/source/email');

    if (isNewVersion && !isEmailSource) {
        return <SafetyReviewOrRedirect backLink={backLink} loaderPage={<AccountLoaderPage />} />;
    }

    return <SecurityCheckupContainer />;
};
