import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import clsx from '@proton/utils/clsx';

import type { PlanCardFeatureDefinition } from '../features/interface';

import './SubscriptionCancelPlan.scss';

interface Props {
    name: string;
    features: PlanCardFeatureDefinition[];
    downgrade?: boolean;
    className?: string;
}

const SubscriptionCancelPlan = ({ name, features, downgrade = false, className }: Props) => {
    return (
        <div className={clsx('rounded border p-6', className)}>
            <div className="mb-2">
                <h3 className="text-bold text-capitalize" id={`desc_${name}`}>
                    {name}
                </h3>
                <span className="color-weak text-sm">
                    {downgrade ? c('Info').t`Current plan` : c('Info').t`Downgrade`}
                </span>
            </div>
            <PlanCardFeatureList
                icon={downgrade ? <Icon name="arrow-up" className="color-success" /> : <Icon name="arrow-down" />}
                features={features}
            />
        </div>
    );
};

export default SubscriptionCancelPlan;
