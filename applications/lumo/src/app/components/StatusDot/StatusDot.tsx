import { useEffect, useState } from 'react';

import { clsx } from 'clsx';

import './StatusDot.scss';

const animatedKeys = new Set<string>();

export type StatusDotVariant = 'accent' | 'attention';

interface StatusDotProps {
    variant: StatusDotVariant;
    /** A keyed dot pops once per request, even if the same dot remounts. */
    animationKey?: string;
    className?: string;
}

/** Visual status marker. The caller supplies any accessible text separately. */
export const StatusDot = ({ variant, animationKey, className }: StatusDotProps) => {
    const [popIn] = useState(() => animationKey !== undefined && !animatedKeys.has(animationKey));

    useEffect(() => {
        if (animationKey !== undefined) {
            animatedKeys.add(animationKey);
        }
    }, [animationKey]);

    return (
        <span
            className={clsx('status-dot', `status-dot--${variant}`, popIn && 'status-dot--pop', className)}
            aria-hidden
        />
    );
};
