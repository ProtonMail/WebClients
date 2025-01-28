import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import type { SUPPORTED_PRODUCTS } from '../interface';
import { usePostSignupOneDollarPromotionPrice } from './usePostSignupOneDollarPromotionPrice';

import './PostSignupOneDollarTitle.scss';

interface Props {
    product: SUPPORTED_PRODUCTS;
    expanded?: boolean;
}

export const PostSignupOneDollarTitle = ({ product, expanded }: Props) => {
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
            <p className={clsx('m-0 color-weak', expanded && 'mb-4')}>{c('Offer').t`Limited-time offer`}</p>
        </header>
    );
};
