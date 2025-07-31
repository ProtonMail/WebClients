import { c } from 'ttag';

import { Button } from '@proton/atoms';

import type { FeatureProps, SUPPORTED_PRODUCTS } from '../interface';
import { PostSignupOneDollarFooter } from './PostSignupOneDollarFooter';
import { PostSignupOneDollarTable } from './PostSignupOneDollarTable';
import { PostSignupOneDollarTitle } from './PostSignupOneDollarTitle';

interface Props {
    product: SUPPORTED_PRODUCTS;
    features: FeatureProps[];
    onClose: () => void;
    onUpsellClick: () => void;
}

export const OfferContent = ({ product, features, onUpsellClick, onClose }: Props) => {
    return (
        <section className="p-6 pt-12">
            <PostSignupOneDollarTitle product={product} />
            <PostSignupOneDollarTable features={features} />
            <PostSignupOneDollarFooter product={product} onClick={onUpsellClick} />
            <div className="text-center">
                <Button onClick={onClose} shape="underline" color="norm" className="p-0">{c('Offer')
                    .t`Maybe later`}</Button>
            </div>
        </section>
    );
};
