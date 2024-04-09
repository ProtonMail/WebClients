import type { FC } from 'react';

import { Icon, type IconName } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

export type InfoCardProps = {
    className?: string;
    icon: IconName;
    subtitle?: string;
    title: string;
};
export const InfoCard: FC<InfoCardProps> = ({ icon, title, subtitle, className }) => (
    <div className={clsx('flex items-center flex-nowrap w-full gap-4 text-sm', className)}>
        <Icon name={icon} size={5} />
        <div className="flex flex-column flex-nowrap justify-start w-full">
            <span className="text-left text-ellipsis color-norm">{title}</span>
            {subtitle && <span className="text-left text-ellipsis color-weak">{subtitle}</span>}
        </div>
    </div>
);
