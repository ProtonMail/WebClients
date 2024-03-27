import { createContext, useContext, useEffect } from 'react';

import { setPaymentsVersion } from '@proton/shared/lib/api/payments';
import { ChargebeeEnabled, UserModel } from '@proton/shared/lib/interfaces';

import { useCachedUser } from './data-utils';

export type CalledKillSwitchString = 'called' | 'not-called';

export type ChargebeeContext = {
    enableChargebee: ChargebeeEnabled;
    setEnableChargebee: (value: ChargebeeEnabled) => unknown;
    calledKillSwitch: CalledKillSwitchString;
    setCalledKillSwitch: (value: CalledKillSwitchString) => unknown;
};

export const PaymentSwitcherContext = createContext<ChargebeeContext>({
    enableChargebee: ChargebeeEnabled.INHOUSE_FORCED,
    setEnableChargebee: () => {},
    calledKillSwitch: 'not-called',
    setCalledKillSwitch: () => {},
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
