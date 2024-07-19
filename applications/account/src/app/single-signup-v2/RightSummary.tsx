import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './RightSummary.scss';

interface Props extends ComponentPropsWithoutRef<'div'> {
    children: ReactNode;
    className?: string;
    variant?: 'gradient' | 'gradientBorder' | 'border';
}

const RightSummary = ({ children, className, variant = 'border', style, ...rest }: Props) => {
    return (
        <div
            className={clsx(
                'right-summary w-full md:max-w-custom',
                className,
                variant === 'gradient' && 'right-summary--gradient',
                variant === 'gradientBorder' && 'right-summary--gradient-border',
                variant === 'border' && 'right-summary--border'
            )}
            style={{ '--md-max-w-custom': '20rem', ...style }}
            {...rest}
        >
            {children}
        </div>
    );
};

export default RightSummary;
