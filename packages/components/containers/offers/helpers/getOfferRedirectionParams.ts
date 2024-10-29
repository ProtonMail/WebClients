import { type Currency } from '@proton/payments';

import type { Deal, Offer } from '../interface';

interface Props {
    offer: Offer;
    deal: Deal;
    currency: Currency;
}

const getOfferRedirectionParams = ({ offer, deal, currency }: Props): URLSearchParams => {
    const { cycle, couponCode, ref, planIDs } = deal;
    const { ID, enableCycleSelector } = offer;
    const [planName] = Object.keys(planIDs);

    const params = new URLSearchParams();
    params.set('cycle', `${cycle}`);
    params.set('currency', currency);
    if (couponCode) {
        params.set('coupon', couponCode);
    }
    params.set('plan', planName);
    params.set('type', 'offer');
    params.set('edit', enableCycleSelector ? 'enable' : 'disable'); // Allow to choose to enable or disable the cycle selector in the subscription modal
    params.set('offer', ID);
    params.set('ref', ref); // Used by data team

    return params;
};

export default getOfferRedirectionParams;
