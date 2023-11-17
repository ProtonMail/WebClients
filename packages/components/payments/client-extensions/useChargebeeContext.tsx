import { createContext, useContext, useEffect } from 'react';

import { setPaymentsVersion } from '@proton/shared/lib/api/payments';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { ChargebeeEnabled, UserModel } from '@proton/shared/lib/interfaces';

import { ChargebeeKillSwitch, ChargebeeKillSwitchData } from '../core';
import { useCachedUser } from './data-utils';

export type ChargebeeContext = {
    enableChargebee: ChargebeeEnabled;
    setEnableChargebee: (value: ChargebeeEnabled) => unknown;
};
export const PaymentSwitcherContext = createContext<ChargebeeContext>({
    enableChargebee: ChargebeeEnabled.INHOUSE_FORCED,
    setEnableChargebee: () => {},
});

export const useChargebeeContext = () => {
    return useContext(PaymentSwitcherContext);
};

export const useChargebeeEnabledCache = () => {
    const chargebeeContext = useChargebeeContext();
    return chargebeeContext.enableChargebee;
};

export const useChargebeeUserStatusTracker = () => {
    // We can't use useUser here, because that would load user from the API if it's missing.
    // We need just to read the information from the cache, no more.
    const maybeUser: UserModel | undefined = useCachedUser();

    const { enableChargebee, setEnableChargebee } = useChargebeeContext();

    useEffect(() => {
        if (
            maybeUser?.ChargebeeUser === ChargebeeEnabled.CHARGEBEE_FORCED &&
            enableChargebee !== ChargebeeEnabled.CHARGEBEE_FORCED
        ) {
            setEnableChargebee(ChargebeeEnabled.CHARGEBEE_FORCED);
            setPaymentsVersion('v5');
        }

        if (
            maybeUser?.ChargebeeUser === ChargebeeEnabled.INHOUSE_FORCED &&
            enableChargebee !== ChargebeeEnabled.INHOUSE_FORCED
        ) {
            setEnableChargebee(ChargebeeEnabled.INHOUSE_FORCED);
            setPaymentsVersion('v4');
        }
    }, [maybeUser?.ChargebeeUser, enableChargebee]);
};

export const useChargebeeKillSwitch = () => {
    const chargebeeContext = useChargebeeContext();

    const chargebeeKillSwitch: ChargebeeKillSwitch = (_data?: ChargebeeKillSwitchData) => {
        const { reason, data, error } = _data ?? {};
        if (error?.name === 'AbortError') {
            return false;
        }

        if (chargebeeContext.enableChargebee === ChargebeeEnabled.CHARGEBEE_ALLOWED) {
            chargebeeContext.setEnableChargebee(ChargebeeEnabled.INHOUSE_FORCED);
            setPaymentsVersion('v4');

            const sentryError = error ?? reason;
            if (sentryError) {
                const context = {
                    reason,
                    ...data,
                };

                captureMessage('Payments: Chargebee kill switch activated', {
                    level: 'error',
                    extra: { error: sentryError, context },
                });
            }

            return true;
        }

        return false;
    };

    const forceEnableChargebee = () => {
        chargebeeContext.setEnableChargebee(ChargebeeEnabled.CHARGEBEE_ALLOWED);
        setPaymentsVersion('v5');
    };

    return {
        chargebeeKillSwitch,
        forceEnableChargebee,
    };
};
