import { useState, useEffect } from 'react';
import { isProductPayer } from '@proton/shared/lib/helpers/blackfriday';
import { LatestSubscription } from '@proton/shared/lib/interfaces';
import { APPS, BLACK_FRIDAY, CYCLE } from '@proton/shared/lib/constants';
import { getLastCancelledSubscription } from '@proton/shared/lib/api/payments';
import { toMap } from '@proton/shared/lib/helpers/object';

import {
    useLoading,
    useUser,
    useSubscription,
    usePlans,
    useApi,
    useConfig,
    useProductPayerPeriod,
    useBlackFridayPeriod,
} from '../../hooks';
import { EligibleOffer } from '../payments/interface';
import { getBlackFridayEligibility } from '../payments/subscription/helpers';
import useIsMounted from '../../hooks/useIsMounted';

const usePromotionOffer = (): EligibleOffer | undefined => {
    const api = useApi();
    const { APP_NAME } = useConfig();
    const [{ isFree, isDelinquent, canPay }] = useUser();
    const [plans = [], loadingPlans] = usePlans();
    const [subscription, loadingSubscription] = useSubscription();
    const [latestSubscription, setLatestSubscription] = useState<LatestSubscription | undefined>(undefined);
    const isBlackFridayPeriod = useBlackFridayPeriod();
    const isProductPayerPeriod = useProductPayerPeriod();
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

    const hasProductPayerOffer =
        !loadingDependencies &&
        !!plans.length &&
        !!subscription &&
        !isDelinquent &&
        canPay &&
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
                  {
                      name: '',
                      cycle: CYCLE.MONTHLY,
                      planIDs: { [plansMap.vpnplus.ID]: 1 },
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

    return blackFridayOffer || productPayerOffer;
};

export default usePromotionOffer;
