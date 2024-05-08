import { useState } from 'react';

import { useSubscription } from '@proton/components/hooks';
import {
    getPlan,
    hasBundle,
    hasDrive,
    hasFamily,
    hasMail,
    hasNewVisionary,
} from '@proton/shared/lib/helpers/subscription';

import useSettingsLink from '../../../../components/link/useSettingsLink';
import { CANCEL_ROUTE } from './helper';

const useB2CCancellationFlow = () => {
    const [subscription] = useSubscription();
    const [startedCancellation, setStartedCancellation] = useState(false);
    const goToSettings = useSettingsLink();
    const plan = getPlan(subscription);

    const getHasAccess = () => {
        if (
            startedCancellation ||
            hasMail(subscription) ||
            hasBundle(subscription) ||
            hasFamily(subscription) ||
            hasNewVisionary(subscription) ||
            hasDrive(subscription)
        ) {
            return true;
        }

        return false;
    };

    const redirectToCancellationFlow = () => {
        goToSettings(CANCEL_ROUTE);
    };

    const redirectToDashboard = () => {
        goToSettings('/dashboard');
    };

    return {
        redirectToCancellationFlow,
        redirectToDashboard,
        hasAccess: getHasAccess(),
        plan,
        subscription,
        setStartedCancellation,
    };
};

export default useB2CCancellationFlow;
