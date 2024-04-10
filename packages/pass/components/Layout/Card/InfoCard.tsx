import type { FC, ReactNode } from 'react';

import { Icon, type IconName } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

export type InfoCardProps = {
    className?: string;
    icon: IconName | (() => ReactNode);
    subtitle?: ReactNode;
    subtitleClassname?: string;
    title: ReactNode;
    titleClassname?: string;
    actions?: ReactNode;
};

export const InfoCard: FC<InfoCardProps> = ({
    actions,
    className,
    icon,
    subtitle,
    subtitleClassname,
    title,
    titleClassname,
}) => (
    <div className={clsx('flex items-center flex-nowrap w-full gap-4 text-sm', className)}>
        {typeof icon === 'function' ? icon() : <Icon name={icon} size={5} />}
        <div className="flex flex-column flex-nowrap justify-start w-full text-left">
            <span className={titleClassname ?? 'color-norm text-ellipsis'}>{title}</span>
            {subtitle && <span className={subtitleClassname ?? 'color-weak text-ellipsis'}>{subtitle}</span>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
    </div>
);
