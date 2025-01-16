import { c } from 'ttag';

import { Button } from '@proton/atoms/index';

import { PostSignupOneDollarFooter } from './PostSignupOneDollarFooter';
import { PostSignupOneDollarTable } from './PostSignupOneDollarTable';
import { PostSignupOneDollarTitle } from './PostSignupOneDollarTitle';
import type { FeatureProps, SUPPORTED_PRODUCTS } from './interface';

interface Props {
    product: SUPPORTED_PRODUCTS;
    features: FeatureProps[];
    imgSrc: string;
    onClose: () => void;
    onUpsellClick: () => void;
    extended?: boolean;
}

export const OfferContent = ({ product, features, imgSrc, onUpsellClick, onClose, extended }: Props) => {
    return (
        <section className="p-6 pt-12">
            {extended && (
                <div className="text-center">
                    <img alt="" src={imgSrc} />
                </div>
            )}
            <PostSignupOneDollarTitle product={product} />
            {extended && <PostSignupOneDollarFooter onClick={onUpsellClick} extended />}
            <PostSignupOneDollarTable features={features} />
            {!extended && <PostSignupOneDollarFooter onClick={onUpsellClick} />}
            <div className="text-center">
                <Button onClick={onClose} shape="underline" color="norm" className="p-0">{c('Offer')
                    .t`Maybe later`}</Button>
            </div>
        </section>
    );
};
