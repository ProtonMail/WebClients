import { ComponentPropsWithoutRef, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './RightSummary.scss';

interface Props extends ComponentPropsWithoutRef<'div'> {
    children: ReactNode;
    className?: string;
    gradient?: boolean;
}

const RightSummary = ({ children, className, gradient = false, style, ...rest }: Props) => {
    return (
        <div
            className={clsx('right-summary w-full md:max-w-custom', className, gradient && 'right-summary--gradient')}
            style={{ '--md-max-w-custom': '20rem', ...style }}
            {...rest}
        >
            {children}
        </div>
    );
};

export default RightSummary;
