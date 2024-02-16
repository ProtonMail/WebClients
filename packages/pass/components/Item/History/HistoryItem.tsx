import type { FC } from 'react';

import { Icon, type IconName } from '@proton/components/index';
import clsx from '@proton/utils/clsx';

type Props = {
    icon: IconName;
    title: string;
    subtitle: string;
    className?: string;
};
export const HistoryItem: FC<Props> = ({ icon, title, subtitle, className }) => {
    return (
        <div className={clsx('flex items-center flex-nowrap w-full gap-4', className)}>
            <Icon name={icon} size={5} className="color-weak" />
            <div className="flex flex-column items-start">
                <span className="text-ellipsis inline-block color-norm">{title}</span>
                <span className="block color-weak text-ellipsis">{subtitle}</span>
            </div>
        </div>
    );
};
