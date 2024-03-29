import type { FC, PropsWithChildren } from 'react';

import { Card as CoreCard } from '@proton/atoms/Card';
import clsx from '@proton/utils/clsx';

import './Card.scss';

type ItemCardProps = { className?: string };

export const Card: FC<PropsWithChildren<ItemCardProps>> = ({ children, className }) => (
    <CoreCard rounded background={false} bordered={false} className={clsx('pass-card text-sm', className)}>
        {children}
    </CoreCard>
);
