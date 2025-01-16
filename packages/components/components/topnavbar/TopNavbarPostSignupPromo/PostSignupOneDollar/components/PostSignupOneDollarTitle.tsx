import { c } from 'ttag';

import type { SUPPORTED_PRODUCTS } from './interface';
import { usePostSignupOneDollarPromotionPrice } from './usePostSignupOneDollarPromotionPrice';

import './PostSignupOneDollarTitle.scss';

interface Props {
    product: SUPPORTED_PRODUCTS;
}

export const PostSignupOneDollarTitle = ({ product }: Props) => {
    const { pricingTitle } = usePostSignupOneDollarPromotionPrice({
        offerProduct: 'mail',
        priceWithGradient: true,
    });

    const title =
        product === 'mail'
            ? c('Offer').jt`Get Mail Plus for only ${pricingTitle}`
            : c('Offer').jt`Get Drive Plus for only ${pricingTitle}`;

    return (
        <header className="text-center mb-2">
            <h2 className="text-xl text-bold mb-2">{title}</h2>
            <p className="m-0 color-weak">{c('Offer').t`Limited-time offer`}</p>
        </header>
    );
};
