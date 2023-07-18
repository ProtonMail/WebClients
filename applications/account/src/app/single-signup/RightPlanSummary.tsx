import { ReactNode } from 'react';

import { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';

interface Props {
    logo: ReactNode;
    title: ReactNode;
    features: PlanCardFeatureDefinition[];
}

const RightPlanSummary = ({ logo, title, features }: Props) => {
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
        </div>
    );
};

export default RightPlanSummary;
