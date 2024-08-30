import type { FC } from 'react';

import { Icon, type IconName } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './CardIcon.scss';

type Props = { className?: string; icon: IconName };

export const CardIcon: FC<Props> = ({ className, icon }) => (
    <div className={clsx('pass-card-icon flex items-center rounded-sm color-strong p-0.5', className)}>
        <Icon name={icon} />
    </div>
);
