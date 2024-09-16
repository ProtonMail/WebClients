import type { CSSProperties, FC, PropsWithChildren } from 'react';

import { Card as CoreCard } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import { type CardType, getCardTheme } from './utils';

import './Card.scss';

type ItemCardProps = { className?: string; style?: CSSProperties; type?: CardType; onClick?: () => void };

export const Card: FC<PropsWithChildren<ItemCardProps>> = ({ children, className, style, type, onClick }) => (
    <CoreCard
        style={style}
        rounded
        background={false}
        bordered={false}
        className={clsx(getCardTheme(type), 'pass-card', `pass-card:${type}`, className)}
        onClick={onClick}
    >
        {children}
    </CoreCard>
);
