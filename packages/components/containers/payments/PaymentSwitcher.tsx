import { ReactNode, useEffect, useState } from 'react';

import {
    PaymentSwitcherContext,
    useChargebeeContext,
} from '@proton/components/payments/client-extensions/useChargebeeContext';
import { setPaymentsVersion } from '@proton/shared/lib/api/payments';
import { isProduction } from '@proton/shared/lib/helpers/sentry';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';

import { useFlag } from '../../containers/unleash';
import { useAuthentication, useGetUser } from '../../hooks';

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

    const forceEnableChargebeeInDev = (): boolean => {
        const isProd = isProduction(window.location.host);
        if (isProd) {
            return false;
        }

        return localStorage.getItem('chargebeeEnabled') === 'true';
    };

    useEffect(() => {
        (window as any).testChargebee = () => {
            console.log(
                'Chargebee test localStorage',
                localStorage.getItem('chargebeeEnabled'),
                'just variable',
                chargebeeEnabled
            );
        };
    }, []);

    useEffect(() => {
        async function isChargebeeEnabled() {
            if (forceEnableChargebeeInDev()) {
                return ChargebeeEnabled.CHARGEBEE_FORCED;
            }

            // user logged in
            if (UID) {
                const user = await getUser();
                const chargebeeUser = user?.ChargebeeUser;
                if (chargebeeUser === ChargebeeEnabled.CHARGEBEE_ALLOWED && !chargebeeFreeToPaidUpgradeFlag) {
                    return ChargebeeEnabled.INHOUSE_FORCED;
                }

                return user?.ChargebeeUser ?? ChargebeeEnabled.INHOUSE_FORCED;
            }

            // signups
            if (!chargebeeSignupsFlag) {
                return ChargebeeEnabled.INHOUSE_FORCED;
            }

            return ChargebeeEnabled.CHARGEBEE_ALLOWED;
        }

        async function run() {
            const chargebeeEnabled = await isChargebeeEnabled();
            console.log(`Chargebee enabled: ${chargebeeEnabled}. chargebeeSignupsFlag: ${chargebeeSignupsFlag}.`);

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
