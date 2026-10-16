import type { CSSProperties, FC, PropsWithChildren } from 'react';

import clsx from '@proton/utils/clsx';

import './Card.scss';

type Props = {
    className?: string;
    style?: CSSProperties;
    variant?: 'default' | 'glass';
};

export const Card: FC<PropsWithChildren<Props>> = ({ children, className, style, variant = 'default' }) => (
    <div
        className={clsx('pass-onboarding-card', variant === 'glass' && 'pass-onboarding-card--glass', className)}
        style={style}
    >
        {children}
    </div>
);
