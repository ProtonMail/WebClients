import clsx from '@proton/utils/clsx';

import { Icon, Info } from '../../../components';
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
        <div className="pr-0 py-4 md:pr-4 flex-1">
            <h3 className="text-bold text-capitalize mb-2" id={`desc_${name}`}>
                {name}
            </h3>
            <p className="text-lg subscription-cancel-plan-info">{info}</p>
            {features.length ? (
                <ul className="unstyled mt-4">
                    {features.map((feature) => {
                        const key =
                            typeof feature.text === 'string'
                                ? feature.text
                                : `${feature.tooltip}-${feature.icon}-${feature.included}-${feature.status}`;
                        return (
                            <li key={key} className="flex flex-nowrap mb-2">
                                <span className={clsx('flex-item-noshrink mr-4', downgrade && 'color-weak')}>
                                    {downgrade ? '-' : <Icon name="checkmark" className="color-primary" />}
                                </span>
                                <span className="flex-1">
                                    <span
                                        className={clsx(
                                            'align-middle',
                                            downgrade && 'text-strike color-weak',
                                            !downgrade && feature.status === 'coming-soon' && 'color-weak'
                                        )}
                                    >
                                        {feature.text}
                                    </span>
                                    {feature.tooltip ? (
                                        <Info buttonClass="align-middle ml-2" title={feature.tooltip} />
                                    ) : null}
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
