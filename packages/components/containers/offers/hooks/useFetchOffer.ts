import { useEffect, useState } from 'react';

import { useLoading } from '@proton/hooks';
import { Currency } from '@proton/shared/lib/interfaces';

import { useApi } from '../../../hooks';
import { fetchDealPrices } from '../helpers/dealPrices';
import { Offer, OfferConfig } from '../interface';

interface Props {
    offerConfig: OfferConfig | undefined;
    currency: Currency;
    onSuccess?: () => void;
    onError?: () => void;
}

function useFetchOffer({ offerConfig, currency, onSuccess, onError }: Props): [Offer | undefined, boolean] {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [state, setState] = useState<Partial<{ offer: Offer; offerConfig: OfferConfig }>>();

    useEffect(() => {
        if (!offerConfig) {
            return;
        }
        const updateOfferPrices = async () => {
            try {
                // Reset previous offer prices in case the offer config has changed from what was previously cached
                if (state?.offerConfig !== offerConfig) {
                    setState(undefined);
                }

                const result = await fetchDealPrices(api, offerConfig, currency);

                // We make an offer based on offerConfig + fetched results above
                const offer: Offer = {
                    ...offerConfig,
                    deals: offerConfig.deals.map((deal, index) => {
                        const [withCoupon, withoutCoupon, withoutCouponMonthly] = result[index];

                        return {
                            ...deal,
                            prices: {
                                withCoupon: withCoupon.Amount + (withCoupon.CouponDiscount || 0),
                                withoutCoupon: withoutCoupon.Amount + (withoutCoupon.CouponDiscount || 0), // BUNDLE discount can be applied
                                withoutCouponMonthly: withoutCouponMonthly.Amount,
                            },
                        };
                    }),
                };
                setState({ offer, offerConfig });
                onSuccess?.();
            } catch (error) {
                onError?.();
            }
        };

        void withLoading(updateOfferPrices());
    }, [offerConfig, currency]);

    return [state?.offer, loading];
}

export default useFetchOffer;
