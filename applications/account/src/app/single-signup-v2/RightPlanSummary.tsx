import { ReactNode } from 'react';

import { c } from 'ttag';

import { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';

import SaveLabel from './SaveLabel';

const RightPlanSummary = ({
    title,
    price,
    regularPrice,
    logo,
    children,
    discount,
    features,
    free,
}: {
    title: string;
    price: ReactNode;
    regularPrice: ReactNode;
    logo: ReactNode;
    children?: ReactNode;
    discount: number;
    features: PlanCardFeatureDefinition[];
    free?: boolean;
}) => {
    return (
        <div className="w100 border rounded-xl p-6">
            <div className="text-rg text-bold mb-4">{c('Info').t`Summary`}</div>
            <div className="flex gap-2 flex-nowrap mb-2 flex-align-items-center">
                <div className="border rounded-lg p-2" title={title}>
                    {logo}
                </div>
                <div className="flex-item-fluid ">
                    <div className="flex gap-2">
                        <div className="text-rg text-bold flex-item-fluid">{title}</div>
                        <div className="text-rg text-bold">{price}</div>
                    </div>
                    <div className="flex-item-fluid flex flex-align-items-center gap-2">
                        {discount > 0 && (
                            <div className="flex-item-fluid">
                                <SaveLabel highlightPrice={false} percent={discount} />
                            </div>
                        )}

                        {free && <div className="flex-item-fluid text-sm color-weak">{c('Info').t`Free forever`}</div>}

                        {discount > 0 && (
                            <span className="inline-flex">
                                <span className="text-sm color-weak text-strike text-ellipsis">{regularPrice}</span>
                                <span className="text-sm color-weak ml-1">{` ${c('Suffix').t`/month`}`}</span>
                            </span>
                        )}

                        {free && <span className="text-sm color-weak ml-1">{` ${c('Suffix').t`/month`}`}</span>}
                    </div>
                </div>
            </div>
            <PlanCardFeatureList
                odd={false}
                margin={false}
                features={features}
                icon={false}
                highlight={false}
                iconSize={16}
                tooltip={false}
                className="text-sm mb-5 gap-1"
                itemClassName="color-weak"
            />
            {children}
        </div>
    );
};

export default RightPlanSummary;
