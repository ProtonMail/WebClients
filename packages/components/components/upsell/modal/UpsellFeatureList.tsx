import type { IconSize } from '@proton/components/components/icon/Icon';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import type { Plan } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isFunction from '@proton/utils/isFunction';

import type { UpsellFeatureName } from './constants';
import { upsellFeatures } from './constants';

type UpsellFeatureListProps = {
    className?: string;
    features: UpsellFeatureName[];
    iconSize: IconSize;
    hideInfo?: boolean;
    plan?: Plan;
    odd?: boolean;
};

const UpsellFeatureList = ({ className, features, iconSize, hideInfo, plan, odd = false }: UpsellFeatureListProps) => {
    return (
        <ul className={clsx('m-0 unstyled', odd && 'odd:bg-weak', className)}>
            {features.map((featureName) => {
                const feature = isFunction(upsellFeatures[featureName])
                    ? upsellFeatures[featureName](plan)
                    : upsellFeatures[featureName];
                if (!feature) {
                    return null;
                }
                return (
                    <li className={clsx('py-2 rounded', odd && 'pl-2')} key={featureName}>
                        <div className="flex flex-nowrap items-center">
                            <div className="mr-3 shrink-0 flex">
                                <Icon className="color-primary m-auto" size={iconSize} name={feature.icon} />
                            </div>
                            <div className="flex-1">
                                <span className="align-middle">{feature.getText()}</span>
                                {feature.getTooltip && !hideInfo ? (
                                    <Info buttonClass="ml-2" title={feature.getTooltip()} />
                                ) : null}
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default UpsellFeatureList;
