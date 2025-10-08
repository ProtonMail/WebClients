import type { FC } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import './CardIcon.scss';

type Props = { className?: string; icon: IconName };

export const CardIcon: FC<Props> = ({ className, icon }) => (
    <div
        className={clsx(
            'pass-card-icon flex justify-center items-center rounded-sm color-strong p-0.5 shrink-0',
            className
        )}
    >
        <Icon name={icon} size={3.5} />
    </div>
);
