import { MutableRefObject, ReactNode, useEffect, useRef, useState } from 'react';

import {
    CalledKillSwitchString,
    PaymentSwitcherContext,
    useChargebeeContext,
} from '@proton/components/payments/client-extensions/useChargebeeContext';
import { setPaymentsVersion } from '@proton/shared/lib/api/payments';
import { APPS } from '@proton/shared/lib/constants';
import { setCookie } from '@proton/shared/lib/helpers/cookies';
import { wait } from '@proton/shared/lib/helpers/promise';
import { isProduction } from '@proton/shared/lib/helpers/sentry';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import { ChargebeeEnabled, User } from '@proton/shared/lib/interfaces';

import { useFlag } from '../../containers/unleash';
import { useAuthentication, useConfig, useGetUser } from '../../hooks';

const forceEnableChargebeeInDev = (): boolean => {
    const isProd = isProduction(window.location.host);
    if (isProd) {
        return false;
    }

    return localStorage.getItem('chargebeeEnabled') === 'true';
};

const forceInHouseInDev = (): boolean => {
    const isProd = isProduction(window.location.host);
    if (isProd) {
        return false;
    }

    return localStorage.getItem('inhouseForced') === 'true';
};

export async function isChargebeeEnabled(
    UID: string | undefined,
    getUser: () => Promise<User>,
    chargebeeSignupsFlag: boolean,
    chargebeeFreeToPaidUpgradeFlag: boolean,
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

        const isInhouseForced =
            chargebeeUser === ChargebeeEnabled.INHOUSE_FORCED ||
            isAccountLite ||
            (!chargebeeFreeToPaidUpgradeFlag && chargebeeUser === ChargebeeEnabled.CHARGEBEE_ALLOWED);

        if (isInhouseForced) {
            return {
                result: ChargebeeEnabled.INHOUSE_FORCED,
                reason: 'user forced',
                params: {
                    isAccountLite,
                    chargebeeFreeToPaidUpgradeFlag,
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
    if (!chargebeeSignupsFlag || isAccountLite) {
        return {
            result: ChargebeeEnabled.INHOUSE_FORCED,
            reason: !chargebeeSignupsFlag ? 'signups disabled' : 'account lite',
            params: {
                isAccountLite,
                chargebeeSignupsFlag,
            },
        };
    }

    return {
        result: ChargebeeEnabled.CHARGEBEE_ALLOWED,
        reason: 'fallback',
        params: {
            authenticated: !!UID,
            chargebeeSignupsFlag,
            isAccountLite,
            chargebeeFreeToPaidUpgradeFlag,
        },
    };
}

export const useIsChargebeeEnabled = () => {
    const chargebeeSignupsFlag = useFlag('ChargebeeSignups');
    const chargebeeFreeToPaidUpgradeFlag = useFlag('ChargebeeFreeToPaid');
    const { APP_NAME } = useConfig();
    const isAccountLite = APP_NAME === APPS.PROTONACCOUNTLITE;

    return (UID: string | undefined, getUser: () => Promise<User>) =>
        isChargebeeEnabled(UID, getUser, chargebeeSignupsFlag, chargebeeFreeToPaidUpgradeFlag, isAccountLite);
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
    const chargebeeSignupsFlag = useFlag('ChargebeeSignups');
    const chargebeeFreeToPaidUpgradeFlag = useFlag('ChargebeeFreeToPaid');
    const [chargebeeEnabled, setChargebeeEnabled] = useState(ChargebeeEnabled.INHOUSE_FORCED);
    const { APP_NAME } = useConfig();
    const isAccountLite = APP_NAME === APPS.PROTONACCOUNTLITE;

    // mirroring the feature flags is required by the telemetry
    useEffect(() => {
        setCookie({
            cookieName: 'ChargebeeSignupsFlag',
            cookieValue: chargebeeSignupsFlag ? '1' : '0',
            cookieDomain: getSecondLevelDomain(window.location.hostname),
            path: '/',
            expirationDate: 'max',
        });

        setCookie({
            cookieName: 'ChargebeeFreeToPaidFlag',
            cookieValue: chargebeeFreeToPaidUpgradeFlag ? '1' : '0',
            cookieDomain: getSecondLevelDomain(window.location.hostname),
            path: '/',
            expirationDate: 'max',
        });
    }, []);

    useEffect(() => {
        async function run() {
            const chargebeeEnabled = await isChargebeeEnabled(
                UID,
                getUser,
                chargebeeSignupsFlag,
                chargebeeFreeToPaidUpgradeFlag,
                isAccountLite
            );
            setChargebeeEnabled(chargebeeEnabled.result);
            setLoaded(true);
        }

        void run();
    }, [UID, chargebeeSignupsFlag, chargebeeFreeToPaidUpgradeFlag]);

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
