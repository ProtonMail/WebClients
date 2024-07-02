import { useState } from 'react';

import { useFlag } from '@unleash/proxy-client-react';

import { useSubscription } from '@proton/components/hooks';
import {
    hasBundle,
    hasBundlePro2024,
    hasDrive,
    hasFamily,
    hasMail,
    hasMailBusiness,
    hasMailPro,
    hasVisionary,
} from '@proton/shared/lib/helpers/subscription';

import useSettingsLink from '../../../../components/link/useSettingsLink';
import { CANCEL_ROUTE } from './helper';

const useCancellationFlow = () => {
    const [subscription] = useSubscription();
    const isNewFlowEnabled = useFlag('NewCancellationFlow');
    const [startedCancellation, setStartedCancellation] = useState(false);
    const goToSettings = useSettingsLink();

    const getHasB2BAccess = () => {
        if (!isNewFlowEnabled) {
            return false;
        }

        if (
            startedCancellation ||
            hasMailPro(subscription) ||
            hasMailBusiness(subscription) ||
            hasBundlePro2024(subscription)
        ) {
            return true;
        }

        return false;
    };

    const getHasB2CAccess = () => {
        if (!isNewFlowEnabled) {
            return false;
        }

        if (
            startedCancellation ||
            hasMail(subscription) ||
            hasBundle(subscription) ||
            hasFamily(subscription) ||
            hasVisionary(subscription) ||
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
        b2cAccess: getHasB2CAccess(),
        b2bAccess: getHasB2BAccess(),
        subscription,
        setStartedCancellation,
    };
};

export default useCancellationFlow;
