import { c } from 'ttag';

import { useZeroNinetyNinePromotionPrice } from '../useZeroNinetyNinePromotionPrice';

import './ZeroNinetyNineOffer.scss';

export const ZeroNinetyNineTitle = () => {
    const { pricingTitle, planName } = useZeroNinetyNinePromotionPrice({ priceWithGradient: true });

    const title = c('Offer').jt`Upgrade your productivity for just ${pricingTitle} with ${planName}`;
    const subtitle = c('Offer').t`Limited-time offer, valid for your first month`;

    return (
        <header className="text-center mb-4">
            <h2 className="text-xl text-bold mb-2 text-wrap-balance">{title}</h2>
            <p className="m-0 color-weak">{subtitle}</p>
        </header>
    );
};
