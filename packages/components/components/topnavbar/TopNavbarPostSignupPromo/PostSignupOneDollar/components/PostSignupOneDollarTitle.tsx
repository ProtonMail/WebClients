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
    const { pricingTitle, planName } = usePostSignupOneDollarPromotionPrice({
        offerProduct: product,
        priceWithGradient: true,
    });

    const title =
        product === 'mail'
            ? c('Offer').jt`Upgrade your productivity for just ${pricingTitle} with ${planName}`
            : c('Offer').jt`Upgrade your storage for just ${pricingTitle} with ${planName}`;

    const subtitle = c('Offer').t`Limited-time offer, valid for your first month`;

    return (
        <header className="text-center mb-4">
            <h2 className="text-xl text-bold mb-2 text-wrap-balance">{title}</h2>
            <p className={clsx('m-0 color-weak', expanded && 'mb-4')}>{subtitle}</p>
        </header>
    );
};
