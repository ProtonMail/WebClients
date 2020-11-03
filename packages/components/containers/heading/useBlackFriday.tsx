import React, { useState, useEffect, useRef } from 'react';
import { isProductPayer } from 'proton-shared/lib/helpers/blackfriday';
import { PlanIDs, Cycle, Currency } from 'proton-shared/lib/interfaces';
import { APPS, BLACK_FRIDAY } from 'proton-shared/lib/constants';
import { getSHA256String } from 'proton-shared/lib/helpers/hash';
import { useLocation } from 'react-router';
import { getSecondLevelDomain } from 'proton-shared/lib/helpers/url';
import { getCookie, setCookie } from 'proton-shared/lib/helpers/cookies';

import { checkLastCancelledSubscription } from '../payments/subscription/helpers';
import {
    useLoading,
    useModals,
    useUser,
    useSubscription,
    usePlans,
    useApi,
    useConfig,
    useProductPayerPeriod,
    useBlackFridayPeriod,
} from '../../hooks';
import { MailBlackFridayModal, NewSubscriptionModal, VPNBlackFridayModal } from '../payments';
import { SUBSCRIPTION_STEPS } from '../payments/subscription/constants';

const cookieExpirationDate = BLACK_FRIDAY.END.toUTCString();
const cookiePath = '/';
const cookieDomain = `.${getSecondLevelDomain()}`;

const setModalCookie = (key: string, value: string) => {
    setCookie({
        cookieName: key,
        cookieValue: value,
        expirationDate: cookieExpirationDate,
        path: cookiePath,
        cookieDomain,
    });
};

const useBlackFriday = () => {
    const api = useApi();
    const { APP_NAME } = useConfig();
    const [{ isFree, isDelinquent, ID }] = useUser();
    const [plans = []] = usePlans();
    const [subscription] = useSubscription();
    const isBlackFridayPeriod = useBlackFridayPeriod();
    const isProductPayerPeriod = useProductPayerPeriod();

    const [blackFridayModalState, setBlackFridayModalState] = useState<string | undefined>(undefined);
    const [productPayerModalState, setProductPayerModalState] = useState<string | undefined>(undefined);

    const keys = useRef<{ blackFridayStateKey?: string; productPayerStateKey?: string }>({});

    useEffect(() => {
        const run = async () => {
            const [newBlackFridayStateKey, newProductPayerStateKey] = await Promise.all([
                getSHA256String(`${ID}${BLACK_FRIDAY.COUPON_CODE}-black-friday-modal`),
                getSHA256String(`${ID}-product-payer-modal`),
            ]);

            keys.current.blackFridayStateKey = newBlackFridayStateKey.slice(0, 8);
            keys.current.productPayerStateKey = newProductPayerStateKey.slice(0, 8);

            setBlackFridayModalState(getCookie(keys.current.blackFridayStateKey) || '');
            setProductPayerModalState(getCookie(keys.current.productPayerStateKey) || '');
        };
        run();
    }, []);

    const [isEligible, setEligibility] = useState(false);
    const location = useLocation();
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const openBlackFridayModal = location.search.includes('modal=bf2020');

    const onSelect = ({
        planIDs,
        cycle,
        currency,
        couponCode,
    }: {
        planIDs: PlanIDs;
        cycle: Cycle;
        currency: Currency;
        couponCode?: string | null;
    }) => {
        createModal(
            <NewSubscriptionModal
                planIDs={planIDs}
                cycle={cycle}
                currency={currency}
                coupon={couponCode}
                step={SUBSCRIPTION_STEPS.PAYMENT}
            />
        );
    };

    useEffect(() => {
        if (isFree && isBlackFridayPeriod) {
            withLoading(checkLastCancelledSubscription(api).then(setEligibility));
        }
    }, [isBlackFridayPeriod, isFree]);

    useEffect(() => {
        if (!keys.current.blackFridayStateKey) {
            return;
        }
        if (isDelinquent) {
            return;
        }
        if (
            plans.length &&
            isBlackFridayPeriod &&
            isEligible &&
            (blackFridayModalState !== '1' || openBlackFridayModal)
        ) {
            setModalCookie(keys.current.blackFridayStateKey, '1');
            setBlackFridayModalState('1');
            if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
                createModal(<VPNBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />);
            } else {
                createModal(<MailBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />);
            }
        }
    }, [blackFridayModalState, isBlackFridayPeriod, isEligible, plans]);

    useEffect(() => {
        if (!keys.current.productPayerStateKey) {
            return;
        }
        if (isDelinquent) {
            return;
        }
        if (plans.length && isProductPayerPeriod && isProductPayer(subscription) && productPayerModalState !== '1') {
            setModalCookie(keys.current.productPayerStateKey, '1');
            setProductPayerModalState('1');
            if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
                createModal(<VPNBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />);
            } else {
                createModal(<MailBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />);
            }
        }
    }, [productPayerModalState, isProductPayerPeriod, subscription, plans]);

    return (
        !loading &&
        plans.length &&
        ((isBlackFridayPeriod && isEligible) || (isProductPayerPeriod && isProductPayer(subscription)))
    );
};

export default useBlackFriday;
