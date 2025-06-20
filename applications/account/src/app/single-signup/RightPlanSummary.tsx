import type { ReactNode } from 'react';

import { c } from 'ttag';

import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';

interface Props {
    logo: ReactNode;
    title: ReactNode;
    features: PlanCardFeatureDefinition[];
    bundle?: { title: string; features: PlanCardFeatureDefinition[] }[];
    trial?: boolean;
    isB2bPlan: boolean;
}

const RightPlanSummary = ({ logo, title, features, bundle, trial, isB2bPlan }: Props) => {
    return (
        <div className="flex flex-column gap-4">
            <div>
                <div className="inline-block border rounded-lg p-2">{logo}</div>
            </div>
            <div className="color-weak text-semibold">{title}</div>
            {isB2bPlan && trial && (
                <span className="color-success text-left text-sm text-bold">
                    {c('b2b_trials_2025_Info').t`Try it free for 14 days`}
                </span>
            )}
            <PlanCardFeatureList
                odd={false}
                margin={false}
                features={features}
                icon={false}
                highlight={false}
                iconSize={4}
                className="mb-5 gap-1"
                itemClassName="color-weak"
            />
            {bundle?.map(({ title, features }) => {
                return (
                    <div key={title}>
                        <div className="color-weak mb-2">
                            <span className="text-semibold">{title}</span>
                        </div>
                        <PlanCardFeatureList
                            odd={false}
                            margin={false}
                            features={features}
                            icon={false}
                            highlight={false}
                            iconSize={4}
                            className="mb-5 gap-1"
                            itemClassName="color-weak"
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default RightPlanSummary;
