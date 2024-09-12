import type { CSSProperties, ComponentPropsWithoutRef, Key, ReactNode } from 'react';

import type { IconName } from '@proton/components';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

export interface BenefitItem {
    text: ReactNode;
    key: Key;
    icon: { name: IconName; style?: CSSProperties };
}

interface Props extends ComponentPropsWithoutRef<'ul'> {
    features: BenefitItem[];
}

const Benefits = ({ className, features, ...rest }: Props) => {
    return (
        <ul className={clsx('unstyled', className)} {...rest}>
            {features.map((item) => {
                return (
                    <li key={item.key} className="flex gap-2 py-1">
                        <div className="shrink-0 color-primary">
                            <Icon
                                size={4}
                                name={item.icon.name}
                                style={item.icon.style ? item.icon.style : undefined}
                                className="align-text-top"
                            />
                        </div>
                        <div className="flex-1 color-weak text-sm">{item.text}</div>
                    </li>
                );
            })}
        </ul>
    );
};

export default Benefits;
