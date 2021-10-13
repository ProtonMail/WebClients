import { useState, useEffect } from 'react';
import { isProductPayer } from '@proton/shared/lib/helpers/blackfriday';
import { PlanIDs, Cycle, Currency } from '@proton/shared/lib/interfaces';
import { APPS, BLACK_FRIDAY } from '@proton/shared/lib/constants';
import { useLocation } from 'react-router';

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
    useFeature,
    useBlackFridayPeriod,
} from '../../hooks';
import { MailBlackFridayModal, SubscriptionModal, VPNBlackFridayModal } from '../payments';
import { SUBSCRIPTION_STEPS } from '../payments/subscription/constants';
import { FeatureCode } from '../features';

const useBlackFriday = () => {
    const api = useApi();
    const { APP_NAME } = useConfig();
    const [{ isFree, isDelinquent }] = useUser();
    const [plans = []] = usePlans();
    const [subscription] = useSubscription();
    const isBlackFridayPeriod = useBlackFridayPeriod();
    const isProductPayerPeriod = useProductPayerPeriod();
    const { feature, update: setModalState } = useFeature(
        isFree ? FeatureCode.BlackFridayPromoShown : FeatureCode.BundlePromoShown
    );
    const modalNotShown = feature?.Value === false;
    const [isEligible, setEligibility] = useState(false);
    const location = useLocation();
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const params = new URLSearchParams(location.search);
    const openBlackFridayModal = (params.get('modal') || '').toLowerCase() === BLACK_FRIDAY.COUPON_CODE.toLowerCase();
    const hasBlackFridayCoupon = (params.get('coupon') || '').toLowerCase() === BLACK_FRIDAY.COUPON_CODE.toLowerCase();

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
            <SubscriptionModal
                planIDs={planIDs}
                cycle={cycle}
                currency={currency}
                coupon={couponCode}
                step={SUBSCRIPTION_STEPS.CHECKOUT}
            />
        );
    };

    useEffect(() => {
        if (isFree && isBlackFridayPeriod) {
            withLoading(checkLastCancelledSubscription(api).then(setEligibility));
        } else {
            setEligibility(false);
        }
    }, [isBlackFridayPeriod, isFree]);

    useEffect(() => {
        if (isDelinquent || !feature) {
            return;
        }
        if (
            plans.length &&
            isBlackFridayPeriod &&
            isEligible &&
            ((modalNotShown && !hasBlackFridayCoupon) || openBlackFridayModal)
        ) {
            setModalState(true);
            if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
                createModal(<VPNBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />);
            } else {
                createModal(<MailBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />);
            }
        }
    }, [feature, isBlackFridayPeriod, isEligible, plans]);

    useEffect(() => {
        if (isDelinquent || !feature) {
            return;
        }
        if (plans.length && isProductPayerPeriod && isProductPayer(subscription) && modalNotShown) {
            setModalState(true);
            if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
                createModal(<VPNBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />);
            } else {
                createModal(<MailBlackFridayModal plans={plans} subscription={subscription} onSelect={onSelect} />);
            }
        }
    }, [feature, isProductPayerPeriod, subscription, plans]);

    return (
        !loading &&
        plans.length &&
        !isDelinquent &&
        ((isBlackFridayPeriod && isEligible) || (isProductPayerPeriod && isProductPayer(subscription)))
    );
};

export default useBlackFriday;
