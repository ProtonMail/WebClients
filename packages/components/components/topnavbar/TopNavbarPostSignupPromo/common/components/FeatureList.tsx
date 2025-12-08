import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import clsx from '@proton/utils/clsx';

import type { TopNavbarOfferConfig } from '../helpers/interface';

export interface ListProps {
    className?: string;
    config: TopNavbarOfferConfig;
}

export const FeatureList = ({ className, config }: ListProps) => {
    return (
        <ul className={clsx('unstyled my-0', className)}>
            {config.features.map((feature) => (
                <li key={feature.name} className="flex flex-nowrap items-start gap-2 mb-1">
                    <IcCheckmark className="shrink-0 color-primary mt-0.5" />
                    <span className="flex-1">{feature.name}</span>
                </li>
            ))}
        </ul>
    );
};
