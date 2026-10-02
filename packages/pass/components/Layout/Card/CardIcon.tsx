import type { FC } from 'react';

import type { IconComponent } from '@proton/icons/component';
import clsx from '@proton/utils/clsx';

import './CardIcon.scss';

type Props = { className?: string; icon: IconComponent };

export const CardIcon: FC<Props> = ({ className, icon: Icon }) => (
    <div
        className={clsx(
            'pass-card-icon flex justify-center items-center rounded-sm color-strong p-0.5 shrink-0',
            className
        )}
    >
        <Icon size={3.5} />
    </div>
);
