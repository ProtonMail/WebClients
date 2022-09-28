import { Currency } from '@proton/shared/lib/interfaces';

import { Deal, Offer } from '../interface';

interface Props {
    offer: Offer;
    deal: Deal;
    currency: Currency;
}

const getOfferRedirectionParams = ({ offer, deal, currency }: Props): URLSearchParams => {
    const { cycle, couponCode, planName } = deal;

    const params = new URLSearchParams();
    params.set('cycle', `${cycle}`);
    params.set('currency', currency);
    if (couponCode) {
        params.set('coupon', couponCode);
    }
    params.set('plan', planName);
    params.set('type', 'offer');
    params.set('edit', 'disable'); // Disable the possibility to edit the configuration in the subscription modal
    params.set('offer', offer.ID);
    params.set('ref', offer.ref); // Used by data team

    return params;
};

export default getOfferRedirectionParams;
