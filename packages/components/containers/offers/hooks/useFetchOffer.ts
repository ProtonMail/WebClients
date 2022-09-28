import { useEffect, useState } from 'react';

import { useApi, useLoading } from '@proton/components/hooks';
import { Currency } from '@proton/shared/lib/interfaces';

import getDealPrices from '../helpers/getDealPrices';
import { Offer, OfferConfig } from '../interface';

interface Props {
    offerConfig: OfferConfig;
    currency: Currency;
    onError?: () => void;
}

function useFetchOffer({ offerConfig, currency, onError }: Props): Offer | undefined {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const [offer, setOffer] = useState<Offer>();

    useEffect(() => {
        const updateOfferPrices = async () => {
            try {
                const result = await getDealPrices(api, offerConfig, currency);

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
                setOffer(offer);
            } catch (error) {
                onError?.();
                throw error;
            }
        };

        void withLoading(updateOfferPrices());
    }, [currency]);

    return loading ? undefined : offer;
}

export default useFetchOffer;
