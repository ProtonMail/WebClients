import { ReactNode } from 'react';

import { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';

interface Props {
    logo: ReactNode;
    title: ReactNode;
    features: PlanCardFeatureDefinition[];
    bundle?: { title: string; features: PlanCardFeatureDefinition[] }[];
    removeBundle?: ReactNode;
}

const RightPlanSummary = ({ logo, title, features, bundle, removeBundle }: Props) => {
    return (
        <div className="flex flex-column gap-4">
            <div>
                <div className="inline-block border rounded-lg p-2">{logo}</div>
            </div>
            <div className="color-weak text-semibold">{title}</div>
            <PlanCardFeatureList
                odd={false}
                margin={false}
                features={features}
                icon={false}
                highlight={false}
                iconSize={16}
                className="mb-5 gap-1"
                itemClassName="color-weak"
            />
            {bundle?.map(({ title, features }, i, arr) => {
                const last = i === arr.length - 1;
                return (
                    <div key={title}>
                        <div className="color-weak mb-2">
                            {last ? (
                                <div className="flex flex-align-items-center gap-2">
                                    {title} {removeBundle}
                                </div>
                            ) : (
                                title
                            )}
                        </div>
                        <PlanCardFeatureList
                            odd={false}
                            margin={false}
                            features={features}
                            icon={false}
                            highlight={false}
                            iconSize={16}
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
