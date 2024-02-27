import { ReactNode, useEffect, useState } from 'react';

import {
    PaymentSwitcherContext,
    useChargebeeContext,
} from '@proton/components/payments/client-extensions/useChargebeeContext';
import { setPaymentsVersion } from '@proton/shared/lib/api/payments';
import { APPS } from '@proton/shared/lib/constants';
import { isProduction } from '@proton/shared/lib/helpers/sentry';
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

export async function isChargebeeEnabledInner(
    UID: string | undefined,
    getUser: () => Promise<User>,
    chargebeeSignupsFlag: boolean,
    chargebeeFreeToPaidUpgradeFlag: boolean,
    isAccountLite: boolean
) {
    if (forceEnableChargebeeInDev()) {
        return ChargebeeEnabled.CHARGEBEE_FORCED;
    }

    if (forceInHouseInDev()) {
        return ChargebeeEnabled.INHOUSE_FORCED;
    }

    // user logged in
    if (UID) {
        const user = await getUser();
        const chargebeeUser = user?.ChargebeeUser;
        if (user?.ChargebeeUser === ChargebeeEnabled.CHARGEBEE_FORCED) {
            return ChargebeeEnabled.CHARGEBEE_FORCED;
        }

        const isInhouseForced =
            user?.ChargebeeUser === ChargebeeEnabled.INHOUSE_FORCED ||
            isAccountLite ||
            (!chargebeeFreeToPaidUpgradeFlag && chargebeeUser === ChargebeeEnabled.CHARGEBEE_ALLOWED);

        if (isInhouseForced) {
            return ChargebeeEnabled.INHOUSE_FORCED;
        }

        // Make sure that the property exists before returning it
        return user?.ChargebeeUser ?? ChargebeeEnabled.INHOUSE_FORCED;
    }

    // signups
    if (!chargebeeSignupsFlag || isAccountLite) {
        return ChargebeeEnabled.INHOUSE_FORCED;
    }

    return ChargebeeEnabled.CHARGEBEE_ALLOWED;
}

export const useIsChargebeeEnabled = () => {
    const chargebeeSignupsFlag = useFlag('ChargebeeSignups');
    const chargebeeFreeToPaidUpgradeFlag = useFlag('ChargebeeFreeToPaid');
    const { APP_NAME } = useConfig();
    const isAccountLite = APP_NAME === APPS.PROTONACCOUNTLITE;

    return (UID: string | undefined, getUser: () => Promise<User>) =>
        isChargebeeEnabledInner(UID, getUser, chargebeeSignupsFlag, chargebeeFreeToPaidUpgradeFlag, isAccountLite);
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

    useEffect(() => {
        async function run() {
            const chargebeeEnabled = await isChargebeeEnabledInner(
                UID,
                getUser,
                chargebeeSignupsFlag,
                chargebeeFreeToPaidUpgradeFlag,
                isAccountLite
            );
            setChargebeeEnabled(chargebeeEnabled);
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
        if (!chargebeeFeatureLoaded) {
            return;
        }
        setLoaded(true);

        const isAllowed = chargebeeEnabled === ChargebeeEnabled.CHARGEBEE_ALLOWED;
        const isForced = chargebeeEnabled === ChargebeeEnabled.CHARGEBEE_FORCED;

        if ((isAllowed || isForced) && chargebeeContext) {
            chargebeeContext.setEnableChargebee(chargebeeEnabled);
        }

        if (isForced) {
            setPaymentsVersion('v5');
        }
    }, [chargebeeFeatureLoaded, chargebeeEnabled]);

    return <>{loaded ? children : loader}</>;
};

const PaymentSwitcher = (props: Props) => {
    const [enableChargebee, setEnableChargebee] = useState<ChargebeeEnabled>(ChargebeeEnabled.INHOUSE_FORCED);

    const chargebeeContext = {
        enableChargebee,
        setEnableChargebee,
    };

    return (
        <PaymentSwitcherContext.Provider value={chargebeeContext}>
            <InnerPaymentSwitcher {...props} />
        </PaymentSwitcherContext.Provider>
    );
};

export default PaymentSwitcher;
