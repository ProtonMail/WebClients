import { Icon, Info } from '../../../components';
import { classnames, generateUID } from '../../../helpers';
import { PlanCardFeatureDefinition } from '../features/interface';

import './SubscriptionCancelPlan.scss';

interface Props {
    name: string;
    info: string;
    features: PlanCardFeatureDefinition[];
    downgrade?: boolean;
}

const SubscriptionCancelPlan = ({ name, info, features, downgrade = false }: Props) => {
    return (
        <div className="pt1 pb1 pr1 on-mobile-pr0 flex-item-fluid">
            <h3 className="text-bold text-capitalize mb0-5" id={`desc_${name}`}>
                {name}
            </h3>
            <p className="text-lg subscription-cancel-plan-info">{info}</p>
            {features.length ? (
                <ul className="unstyled mt1">
                    {features.map((feature) => {
                        const key =
                            typeof feature.featureName === 'string' ? feature.featureName : generateUID('featureName');
                        return (
                            <li key={key} className="flex flex-nowrap mb0-5">
                                <span className={classnames(['flex-item-noshrink mr1', downgrade && 'color-weak'])}>
                                    {downgrade ? '-' : <Icon name="checkmark" className="color-primary" />}
                                </span>
                                <span className={classnames(['mr0-25', downgrade && 'text-strike color-weak'])}>
                                    {feature.featureName}
                                </span>
                                <span>
                                    {feature.tooltip ? <Info className="ml0-5" title={feature.tooltip} /> : null}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </div>
    );
};

export default SubscriptionCancelPlan;
