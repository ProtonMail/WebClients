import { Icon, Info } from '../../../components';
import { classnames } from '../../../helpers';
import { FeatureItem } from './PlanCardFeatures';
import './SubscriptionCancelPlan.scss';

interface Props {
    name: string;
    info: string;
    features: FeatureItem[];
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
                <ul className="unstyled m0">
                    {features.map(({ feature, tooltip, link }) => {
                        return (
                            <li key={feature?.toString()} className="flex flex-nowrap mb0-5">
                                <span className={classnames(['flex-item-noshrink mr1', downgrade && 'color-weak'])}>
                                    {downgrade ? '-' : <Icon name="checkmark" className="color-primary" />}
                                </span>
                                <span className={classnames(['mr0-25', downgrade && 'text-strike color-weak'])}>
                                    {feature}
                                </span>
                                <span>{tooltip ? <Info className="ml0-5" title={tooltip} url={link} /> : null}</span>
                            </li>
                        );
                    })}
                </ul>
            ) : null}
        </div>
    );
};

export default SubscriptionCancelPlan;
