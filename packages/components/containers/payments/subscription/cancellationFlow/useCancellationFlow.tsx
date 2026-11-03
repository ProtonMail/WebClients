import { useState } from 'react';

import {
    hasBundle,
    hasBundleBiz2025,
    hasBundlePro2024,
    hasDrive,
    hasDuo,
    hasFamily,
    hasMail,
    hasMailBusiness,
    hasMailPro,
    hasVisionary,
} from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';

import useSettingsLink from '../../../../components/link/useSettingsLink';
import { getCancelRoute } from './helper';

const getHasB2BAccess = (subscription: Subscription) => {
    return (
        hasMailPro(subscription) ||
        hasMailBusiness(subscription) ||
        hasBundlePro2024(subscription) ||
        hasBundleBiz2025(subscription)
    );
};

const getHasB2CAccess = (subscription: Subscription) => {
    return (
        hasMail(subscription) ||
        hasBundle(subscription) ||
        hasDuo(subscription) ||
        hasFamily(subscription) ||
        hasVisionary(subscription) ||
        hasDrive(subscription)
    );
};

export const getCanUseCancellationReminder = (subscription: Subscription) => {
    return getHasB2BAccess(subscription) || getHasB2CAccess(subscription);
};

const useCancellationFlow = () => {
    const [startedCancellation, setStartedCancellation] = useState(false);
    const goToSettings = useSettingsLink();

    const redirectToCancellationFlow = (subscription: Subscription) => {
        goToSettings(getCancelRoute(subscription));
    };

    const redirectToDashboard = () => {
        goToSettings('/dashboard');
    };

    return {
        redirectToCancellationFlow,
        redirectToDashboard,
        startedCancellation,
        setStartedCancellation,
    };
};

export default useCancellationFlow;
