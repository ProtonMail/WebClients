import { ReactNode } from 'react';

import { c } from 'ttag';

import { getDealDurationText } from '@proton/components/containers/offers/helpers/offerCopies';
import { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { CYCLE } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import SaveLabel from './SaveLabel';

const RightPlanSummary = ({
    cycle,
    title,
    price,
    regularPrice,
    logo,
    children,
    discount,
    features,
    free,
    className,
}: {
    cycle?: CYCLE;
    title: string;
    price: ReactNode;
    regularPrice: ReactNode;
    logo: ReactNode;
    children?: ReactNode;
    discount: number;
    features: PlanCardFeatureDefinition[];
    free?: boolean;
    className?: string;
}) => {
    return (
        <div className={clsx('w-full border rounded-xl p-6', className)}>
            <div className="text-rg text-bold mb-4">{c('Info').t`Summary`}</div>
            <div className="flex gap-2 flex-nowrap mb-2 items-center">
                <div className="border rounded-lg p-2" title={title}>
                    {logo}
                </div>
                <div className="flex-item-fluid ">
                    <div className="flex gap-2">
                        <div className="text-rg text-bold flex-item-fluid">{title}</div>
                        <div className="text-rg text-bold">{price}</div>
                    </div>
                    <div className="flex flex-item-fluid items-center gap-1 text-sm">
                        {!free && <div className="color-weak text-ellipsis">{getDealDurationText(cycle)}</div>}
                        {(() => {
                            if (free) {
                                return (
                                    <div className="flex-item-fluid-auto color-weak">{c('Info').t`Free forever`}</div>
                                );
                            }
                            if (discount > 0) {
                                return (
                                    <>
                                        <div className="flex-item-fluid-auto">
                                            <SaveLabel percent={discount} />
                                        </div>
                                        <span className="inline-flex">
                                            <span className="color-weak text-strike text-ellipsis">{regularPrice}</span>
                                            <span className="color-weak ml-1">{` ${c('Suffix').t`/month`}`}</span>
                                        </span>
                                    </>
                                );
                            }
                        })()}
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
