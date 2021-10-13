import { useState, useEffect, useRef } from 'react';
import { isProductPayer } from '@proton/shared/lib/helpers/blackfriday';
import { PlanIDs, Cycle, Currency, LatestSubscription } from '@proton/shared/lib/interfaces';
import { APPS, BLACK_FRIDAY, CYCLE } from '@proton/shared/lib/constants';
import { useLocation } from 'react-router';
import { getLastCancelledSubscription } from '@proton/shared/lib/api/payments';
import { toMap } from '@proton/shared/lib/helpers/object';
import { dialogRootClassName } from '@proton/shared/lib/busy';

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
import { BlackFridayModal, SubscriptionModal } from '../payments';
import { SUBSCRIPTION_STEPS } from '../payments/subscription/constants';
import { FeatureCode } from '../features';
import { EligibleOffer } from '../payments/interface';
import { getBlackFridayEligibility } from '../payments/subscription/helpers';
import useIsMounted from '../../hooks/useIsMounted';

const usePromotionOffer = (): EligibleOffer | undefined => {
    const api = useApi();
    const { APP_NAME } = useConfig();
    const [{ isFree, isDelinquent }] = useUser();
    const [plans = []] = usePlans();
    const [subscription] = useSubscription();
    const [latestSubscription, setLatestSubscription] = useState<LatestSubscription | undefined>(undefined);
    const isBlackFridayPeriod = useBlackFridayPeriod();
    const isProductPayerPeriod = useProductPayerPeriod();
    const { feature, update: setModalState } = useFeature(
        isFree ? FeatureCode.BlackFridayPromoShown : FeatureCode.BundlePromoShown
    );
    const location = useLocation();
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const params = new URLSearchParams(location.search);
    const openBlackFridayModal = (params.get('modal') || '').toLowerCase() === BLACK_FRIDAY.COUPON_CODE.toLowerCase();
    const hasBlackFridayCoupon = (params.get('coupon') || '').toLowerCase() === BLACK_FRIDAY.COUPON_CODE.toLowerCase();

    const handleOnSelect = ({
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

    const plansMap = toMap(plans, 'Name');

    const hasBlackFridayOffer =
        !loading &&
        !!plans.length &&
        !!subscription &&
        !!latestSubscription &&
        !isDelinquent &&
        isBlackFridayPeriod &&
        getBlackFridayEligibility(subscription, latestSubscription);

    const hasProductPayerOffer =
        !loading &&
        !!plans.length &&
        subscription &&
        !isDelinquent &&
        !hasBlackFridayOffer &&
        isProductPayerPeriod &&
        isProductPayer(subscription);

    const blackFridayOffer: EligibleOffer | undefined = hasBlackFridayOffer
        ? {
              name: 'black-friday' as const,
              isVPNOnly: true,
              plans: [
                  {
                      name: '',
                      cycle: CYCLE.MONTHLY,
                      planIDs: { [plansMap.vpnplus.ID]: 1 },
                      couponCode: BLACK_FRIDAY.COUPON_CODE,
                  },
                  {
                      name: '',
                      cycle: CYCLE.TWO_YEARS,
                      planIDs: {
                          [plansMap.vpnplus.ID]: 1,
                      },
                      couponCode: BLACK_FRIDAY.COUPON_CODE,
                      popular: true,
                  },
                  {
                      name: '',
                      cycle: CYCLE.YEARLY,
                      planIDs: {
                          [plansMap.vpnplus.ID]: 1,
                      },
                      couponCode: BLACK_FRIDAY.COUPON_CODE,
                  },
              ],
          }
        : undefined;

    const productPayerOffer: EligibleOffer | undefined = hasProductPayerOffer
        ? {
              name: 'product-payer' as const,
              plans: [
                  {
                      name:
                          APP_NAME === APPS.PROTONVPN_SETTINGS
                              ? 'ProtonVPN Plus + ProtonMail Plus'
                              : 'ProtonMail Plus + ProtonVPN Plus',
                      cycle: CYCLE.TWO_YEARS,
                      planIDs: {
                          [plansMap.plus.ID]: 1,
                          [plansMap.vpnplus.ID]: 1,
                      },
                  },
              ],
          }
        : undefined;

    const isMounted = useIsMounted();

    useEffect(() => {
        // Only fetching this during the black friday period
        if (!isBlackFridayPeriod) {
            return;
        }
        if (!isFree) {
            setLatestSubscription({ LastSubscriptionEnd: 0 });
            return;
        }
        const run = async () => {
            const result = await api<LatestSubscription>(getLastCancelledSubscription()).catch(() => undefined);
            if (isMounted()) {
                setLatestSubscription(result);
            }
        };
        withLoading(run());
    }, [isBlackFridayPeriod, isFree]);

    const onceRef = useRef(false);
    const offer = blackFridayOffer || productPayerOffer;

    useEffect(() => {
        if (
            !onceRef.current &&
            offer &&
            (feature?.Value === false || openBlackFridayModal || hasBlackFridayCoupon) &&
            // This is not great but don't want to trigger this if other modals are open, such as the welcome flow
            !document.querySelector(`.${dialogRootClassName}`)
        ) {
            onceRef.current = true;
            setModalState(true);
            createModal(<BlackFridayModal offer={offer} onSelect={handleOnSelect} />);
        }
        // Listening to booleans instead of the offers to have a stable value...
    }, [feature, !!blackFridayOffer, !!productPayerOffer]);

    return offer;
};

export default usePromotionOffer;
