import { type FC, type ReactNode, useId } from 'react';

import { c } from 'ttag';

import { Button, type ButtonLikeShape } from '@proton/atoms/src';
import { Icon } from '@proton/components';

import { PlanProducts } from './PlanProducts';

import './PlanCard.scss';

export type PlanCardProps = {
    title: ReactNode;
    price: string;
    priceSubtitle: string;
    buttonText: string;
    buttonShape?: ButtonLikeShape;
    buttonAction: () => void;
    featuresTitle?: string;
    features: string[];
    showProducts?: boolean;
    recommended?: boolean;
};

export const PlanCard: FC<PlanCardProps> = ({
    title,
    price,
    priceSubtitle,
    buttonText,
    buttonShape = 'outline',
    featuresTitle,
    features,
    showProducts,
    buttonAction,
    recommended,
}) => {
    const id = useId();

    return (
        <div className={`pass-plan-card ${recommended && 'pass-plan-card-recommended border-gradient'} relative p-6`}>
            <h2 className="text-2xl text-bold">{title}</h2>
            <h1 className="text-40 text-bold">{price}</h1>
            <h4 className="text-sm color-weak">{priceSubtitle}</h4>
            <Button
                size="large"
                color="norm"
                shape={buttonShape}
                fullWidth
                pill
                className={`mt-6 py-2 ${!recommended && 'text-md'}`}
                onClick={buttonAction}
            >
                {buttonText}
            </Button>
            {showProducts && <PlanProducts />}
            <div className="mt-8">
                {featuresTitle && <div className="mb-4">{featuresTitle}</div>}
                {features.map((feature) => (
                    <div key={`${id}-${feature}`} className="mb-4">
                        <Icon name="checkmark" className="mr-1" />
                        {feature}
                    </div>
                ))}
            </div>
            {recommended && (
                <div
                    className="pass-plan-card-recommended-banner absolute flex items-center justify-center py-2 bg-primary top-custom left-custom"
                    style={{ '--top-custom': '-2rem', '--left-custom': '-4px' }}
                >{c('Label').t`Recommended`}</div>
            )}
        </div>
    );
};
