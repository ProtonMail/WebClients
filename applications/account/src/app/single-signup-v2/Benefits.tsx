import type { CSSProperties, ComponentPropsWithoutRef, ComponentType, Key, ReactNode } from 'react';

import type { IconSize } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

interface IconProps {
    className?: string;
    size?: IconSize;
    style?: CSSProperties;
}

export interface BenefitItem {
    text: ReactNode;
    key: Key;
    icon: { component: ComponentType<IconProps>; style?: CSSProperties };
}

interface Props extends ComponentPropsWithoutRef<'ul'> {
    features: BenefitItem[];
}

const Benefits = ({ className, features, ...rest }: Props) => {
    return (
        <ul className={clsx('unstyled', className)} {...rest}>
            {features.map((item) => {
                const IconComponent = item.icon.component;
                return (
                    <li key={item.key} className="flex gap-2 py-1">
                        <div className="shrink-0 color-primary">
                            <IconComponent
                                size={4}
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
