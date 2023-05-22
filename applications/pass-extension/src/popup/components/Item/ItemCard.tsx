import type { FC } from 'react';

import { Card } from '@proton/atoms/Card';
import clsx from '@proton/utils/clsx';

import './ItemCard.scss';

type ItemCardProps = {
    className?: string;
};

export const ItemCard: FC<ItemCardProps> = ({ children, className }) => (
    <Card rounded background={false} bordered={false} className={clsx('pass-item-card text-sm', className)}>
        {children}
    </Card>
);
