import { useEffect, useState } from 'react';
import { LatestSubscription } from '@proton/shared/lib/interfaces';
import { BLACK_FRIDAY, CYCLE, PLANS } from '@proton/shared/lib/constants';
import { getLastCancelledSubscription } from '@proton/shared/lib/api/payments';
import { toMap } from '@proton/shared/lib/helpers/object';

import { useApi, useBlackFridayPeriod, useLoading, usePlans, useSubscription, useUser } from '../../hooks';
import { EligibleOffer } from '../payments/interface';
import { getBlackFridayEligibility } from '../payments/subscription/helpers';
import useIsMounted from '../../hooks/useIsMounted';

const usePromotionOffer = (): EligibleOffer | undefined => {
    const api = useApi();
    const [{ isFree, isDelinquent, canPay }] = useUser();
    const [plans = [], loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [latestSubscription, setLatestSubscription] = useState<LatestSubscription | undefined>(undefined);
    const isBlackFridayPeriod = useBlackFridayPeriod();
    const [loading, withLoading] = useLoading();

    const plansMap = toMap(plans, 'Name');

    const loadingDependencies = loading || loadingPlans || loadingSubscription;

    const hasBlackFridayOffer =
        !loadingDependencies &&
        !!plans.length &&
        !!subscription &&
        !!latestSubscription &&
        canPay &&
        !isDelinquent &&
        isBlackFridayPeriod &&
        getBlackFridayEligibility(subscription, latestSubscription);

    const blackFridayOffer: EligibleOffer | undefined = hasBlackFridayOffer
        ? {
              name: 'black-friday' as const,
              isVPNOnly: true,
              plans: [
                  {
                      name: '',
                      cycle: CYCLE.TWO_YEARS,
                      plan: PLANS.VPNPLUS,
                      planIDs: { [plansMap.vpnplus.ID]: 1 },
                      couponCode: BLACK_FRIDAY.COUPON_CODE,
                      popular: true,
                  },
                  {
                      name: '',
                      cycle: CYCLE.YEARLY,
                      plan: PLANS.VPNPLUS,
                      planIDs: { [plansMap.vpnplus.ID]: 1 },
                      couponCode: BLACK_FRIDAY.COUPON_CODE,
                  },
                  {
                      name: '',
                      cycle: CYCLE.MONTHLY,
                      plan: PLANS.VPNPLUS,
                      planIDs: { [plansMap.vpnplus.ID]: 1 },
                      couponCode: BLACK_FRIDAY.COUPON_CODE,
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

    return blackFridayOffer;
};

export default usePromotionOffer;
