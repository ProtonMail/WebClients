import { checkSubscription } from '@proton/shared/lib/api/payments';
import { CYCLE } from '@proton/shared/lib/constants';
import { Api, Currency, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';

import { OfferConfig } from '../interface';

const getDealPrices = async (api: Api, offerConfig: OfferConfig, currency: Currency) =>
    Promise.all(
        offerConfig.deals.map(({ planIDs, cycle, couponCode }) => {
            return Promise.all([
                api<SubscriptionCheckResponse>(
                    checkSubscription({
                        Plans: planIDs,
                        CouponCode: couponCode,
                        Currency: currency,
                        Cycle: cycle,
                    })
                ),
                api<SubscriptionCheckResponse>(
                    checkSubscription({
                        Plans: planIDs,
                        Currency: currency,
                        Cycle: cycle,
                    })
                ),
                api<SubscriptionCheckResponse>(
                    checkSubscription({
                        Plans: planIDs,
                        Currency: currency,
                        Cycle: CYCLE.MONTHLY,
                    })
                ),
            ]);
        })
    );

export default getDealPrices;
