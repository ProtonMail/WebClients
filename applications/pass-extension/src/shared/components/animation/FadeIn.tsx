import type { FC, HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './FadeIn.scss';

type Props = {
    duration?: number;
    delay?: number;
    children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export const FadeIn: FC<Props> = ({ children, className, duration = 250, delay = 0, style, ...attributes }) => (
    <div
        className={clsx(className, 'anime-fade-in')}
        style={{ '--anime-duration': `${duration}ms`, '--anime-delay': `${delay}ms`, ...(style ?? {}) }}
        {...attributes}
    >
        {children}
    </div>
);
