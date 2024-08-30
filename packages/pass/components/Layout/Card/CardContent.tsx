import type { FC, ReactNode } from 'react';

import { Icon, type IconName, type IconProps } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './CardContent.scss';

export type CardContentProps = {
    actions?: ReactNode;
    className?: string;
    ellipsis?: boolean;
    icon?: IconName | (() => ReactNode);
    iconProps?: Partial<IconProps>;
    subtitle?: ReactNode;
    subtitleClassname?: string;
    title: ReactNode;
    titleClassname?: string;
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
        {typeof icon === 'function' ? icon() : icon && <Icon name={icon} size={5} {...iconProps} />}
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
