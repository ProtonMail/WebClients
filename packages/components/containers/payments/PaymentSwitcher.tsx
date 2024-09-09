import type { MutableRefObject, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { CalledKillSwitchString } from '@proton/components/payments/client-extensions/useChargebeeContext';
import {
    PaymentSwitcherContext,
    useChargebeeContext,
} from '@proton/components/payments/client-extensions/useChargebeeContext';
import { setPaymentsVersion } from '@proton/shared/lib/api/payments';
import { APPS } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { isProduction } from '@proton/shared/lib/helpers/sentry';
import { getItem } from '@proton/shared/lib/helpers/storage';
import type { User } from '@proton/shared/lib/interfaces';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';

import { useAuthentication, useConfig, useGetUser } from '../../hooks';

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

    // signups
    if (isAccountLite) {
        return {
            result: ChargebeeEnabled.INHOUSE_FORCED,
            reason: 'account lite',
            params: {
                isAccountLite,
            },
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

/**
 * Important: DO NOT use in your components. Most likely, you need useChargebeeEnabledCache.
 */
export const useChargebeeFeature = () => {
    const getUser = useGetUser();
    const { UID } = useAuthentication();
    const [chargebeeFeatureLoaded, setLoaded] = useState(false);
    const [chargebeeEnabled, setChargebeeEnabled] = useState(ChargebeeEnabled.INHOUSE_FORCED);
    const { APP_NAME } = useConfig();
    const isAccountLite = APP_NAME === APPS.PROTONACCOUNTLITE;

    useEffect(() => {
        async function run() {
            const chargebeeEnabled = await isChargebeeEnabled(UID, getUser, isAccountLite);
            setChargebeeEnabled(chargebeeEnabled.result);
            setLoaded(true);
        }

        void run();
    }, [UID]);

    return {
        chargebeeEnabled,
        chargebeeFeatureLoaded,
    };
};

interface Props {
    loader: ReactNode;
    children: ReactNode;
}

const InnerPaymentSwitcher = ({ loader, children }: Props) => {
    const { chargebeeEnabled, chargebeeFeatureLoaded } = useChargebeeFeature();
    const [loaded, setLoaded] = useState(false);
    const chargebeeContext = useChargebeeContext();

    useEffect(() => {
        async function run() {
            if (!chargebeeFeatureLoaded) {
                return;
            }

            const isAllowed = chargebeeEnabled === ChargebeeEnabled.CHARGEBEE_ALLOWED;
            const isForced = chargebeeEnabled === ChargebeeEnabled.CHARGEBEE_FORCED;

            if ((isAllowed || isForced) && chargebeeContext) {
                chargebeeContext.enableChargebeeRef.current = chargebeeEnabled;
            }

            if (isForced) {
                setPaymentsVersion('v5');
            }

            await wait(0);
            setLoaded(true);
        }

        void run();
    }, [chargebeeFeatureLoaded, chargebeeEnabled]);

    return <>{loaded ? children : loader}</>;
};

const PaymentSwitcher = (props: Props) => {
    const enableChargebeeRef: MutableRefObject<ChargebeeEnabled> = useRef<ChargebeeEnabled>(
        ChargebeeEnabled.INHOUSE_FORCED
    );
    const [calledKillSwitch, setCalledKillSwitch] = useState<CalledKillSwitchString>('not-called');

    const chargebeeContext = {
        enableChargebeeRef,
        calledKillSwitch,
        setCalledKillSwitch,
    };

    return (
        <PaymentSwitcherContext.Provider value={chargebeeContext}>
            <InnerPaymentSwitcher {...props} />
        </PaymentSwitcherContext.Provider>
    );
};

export default PaymentSwitcher;
