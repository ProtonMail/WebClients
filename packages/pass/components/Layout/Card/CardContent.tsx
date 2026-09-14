import type { FC, ReactNode } from 'react';

import type { IconComponent, IconComponentProps } from '@proton/icons/component';
import clsx from '@proton/utils/clsx';

import './CardContent.scss';

export type CardContentProps = {
    actions?: ReactNode;
    className?: string;
    ellipsis?: boolean;
    icon?: IconComponent | ReactNode;
    iconProps?: Partial<IconComponentProps>;
    subtitle?: ReactNode;
    subtitleClassname?: string;
    title: ReactNode;
    titleClassname?: string;
};

/**
 * A function is the icon component; anything else is already-rendered content.
 * An icon component is itself a function, so the test cannot be the other way
 * round without calling the component as a bare function.
 */
const CardContentIcon: FC<Pick<CardContentProps, 'icon' | 'iconProps'>> = ({ icon, iconProps }) => {
    if (typeof icon !== 'function') return <>{icon}</>;
    const Icon = icon;
    return <Icon size={5} {...iconProps} />;
};

export const CardContent: FC<CardContentProps> = ({
    actions,
    className,
    ellipsis,
    icon,
    iconProps,
    subtitle,
    subtitleClassname,
    title,
    titleClassname,
}) => (
    <div className={clsx('pass-card--content flex items-center flex-nowrap w-full gap-4 text-sm', className)}>
        <CardContentIcon icon={icon} iconProps={iconProps} />
        <div className="flex flex-column flex-nowrap justify-start w-full text-left">
            <span className={clsx('pass-card-content--title', ellipsis && 'text-ellipsis', titleClassname)}>
                {title}
            </span>
            {subtitle && (
                <span className={clsx('pass-card-content--subtitle', ellipsis && 'text-ellipsis', subtitleClassname)}>
                    {subtitle}
                </span>
            )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
    </div>
);
