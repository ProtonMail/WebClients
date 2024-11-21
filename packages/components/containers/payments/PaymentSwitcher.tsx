import type { MutableRefObject, PropsWithChildren } from 'react';
import { useRef, useState } from 'react';

import { useGetUser } from '@proton/account/user/hooks';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import useConfig from '@proton/components/hooks/useConfig';
import type { CalledKillSwitchString } from '@proton/components/payments/client-extensions/useChargebeeContext';
import { PaymentSwitcherContext } from '@proton/components/payments/client-extensions/useChargebeeContext';
import { APPS } from '@proton/shared/lib/constants';
import { isProduction } from '@proton/shared/lib/helpers/sentry';
import { getItem } from '@proton/shared/lib/helpers/storage';
import type { User } from '@proton/shared/lib/interfaces';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';

const forceEnableChargebeeInDev = (): boolean => {
    const isProd = isProduction(window.location.host);
    if (isProd) {
        return false;
    }

    return getItem('chargebeeEnabled') === 'true';
};

const forceInHouseInDev = (): boolean => {
    const isProd = isProduction(window.location.host);
    if (isProd) {
        return false;
    }

    return getItem('inhouseForced') === 'true';
};

export async function isChargebeeEnabled(
    UID: string | undefined,
    getUser: () => Promise<User>,
    isAccountLite: boolean
): Promise<{
    result: ChargebeeEnabled;
    reason: string;
    params?: Record<string, any>;
}> {
    if (forceEnableChargebeeInDev()) {
        return {
            result: ChargebeeEnabled.CHARGEBEE_FORCED,
            reason: 'forced in dev',
        };
    }

    if (forceInHouseInDev()) {
        return {
            result: ChargebeeEnabled.INHOUSE_FORCED,
            reason: 'forced in dev',
        };
    }

    // user logged in
    if (UID) {
        const user = await getUser();
        const chargebeeUser = user?.ChargebeeUser;
        if (chargebeeUser === ChargebeeEnabled.CHARGEBEE_FORCED) {
            return {
                result: ChargebeeEnabled.CHARGEBEE_FORCED,
                reason: 'user forced',
            };
        }

        const isInhouseForced = chargebeeUser === ChargebeeEnabled.INHOUSE_FORCED || isAccountLite;

        if (isInhouseForced) {
            return {
                result: ChargebeeEnabled.INHOUSE_FORCED,
                reason: 'user forced',
                params: {
                    isAccountLite,
                    chargebeeUser,
                },
            };
        }

        // Make sure that the property exists before returning it
        return {
            result: chargebeeUser ?? ChargebeeEnabled.INHOUSE_FORCED,
            reason: chargebeeUser !== undefined ? 'user defined' : 'user not defined',
        };
    }

    return {
        result: ChargebeeEnabled.CHARGEBEE_FORCED,
        reason: 'fallback',
        params: {
            authenticated: !!UID,
            isAccountLite,
        },
    };
}

export const useIsChargebeeEnabled = () => {
    const { APP_NAME } = useConfig();
    const isAccountLite = APP_NAME === APPS.PROTONACCOUNTLITE;

    return (UID: string | undefined, getUser: () => Promise<User>) => isChargebeeEnabled(UID, getUser, isAccountLite);
};

export const useIsChargebeeEnabledWithoutParams = () => {
    const getUser = useGetUser();
    const { UID } = useAuthentication();
    const isChargebeeEnabled = useIsChargebeeEnabled();

    return () => isChargebeeEnabled(UID, getUser);
};

const PaymentSwitcher = ({ children }: PropsWithChildren) => {
    const enableChargebeeRef: MutableRefObject<ChargebeeEnabled> = useRef<ChargebeeEnabled>(
        ChargebeeEnabled.CHARGEBEE_FORCED
    );
    const [calledKillSwitch, setCalledKillSwitch] = useState<CalledKillSwitchString>('not-called');

    const chargebeeContext = {
        enableChargebeeRef,
        calledKillSwitch,
        setCalledKillSwitch,
    };

    return <PaymentSwitcherContext.Provider value={chargebeeContext}>{children}</PaymentSwitcherContext.Provider>;
};

export default PaymentSwitcher;
