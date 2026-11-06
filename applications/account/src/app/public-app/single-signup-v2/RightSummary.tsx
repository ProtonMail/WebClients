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
                'right-summary w-full md:w-4/10 lg:w-1/3',
                className,
                variant === 'gradient' && 'right-summary--gradient',
                variant === 'gradientBorder' && 'right-summary--gradient-border',
                variant === 'border' && 'right-summary--border'
            )}
            {...rest}
        >
            {children}
        </div>
    );
};

export default RightSummary;
