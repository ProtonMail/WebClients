import type { FC } from 'react';

import { Icon, type IconName } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

export type InfoCardProps = {
    className?: string;
    icon: IconName;
    subtitle: string;
    title: string;
};
export const InfoCard: FC<InfoCardProps> = ({ icon, title, subtitle, className }) => (
    <div className={clsx('flex items-center flex-nowrap w-full gap-4 text-sm', className)}>
        <Icon name={icon} size={5} className="color-weak" />
        <div className="flex flex-column items-start">
            <span className="text-ellipsis inline-block color-norm">{title}</span>
            <span className="block color-weak text-ellipsis">{subtitle}</span>
        </div>
    </div>
);
