import { CSSProperties, ComponentPropsWithoutRef, Key, ReactNode } from 'react';

import { Icon, IconName } from '@proton/components/components';
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
                        <div className="flex-item-noshrink color-primary">
                            <Icon
                                size={16}
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
