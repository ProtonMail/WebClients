import { ComponentPropsWithoutRef, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './RightSummary.scss';

interface Props extends ComponentPropsWithoutRef<'div'> {
    children: ReactNode;
    className?: string;
    gradient?: boolean;
}

const RightSummary = ({ children, className, gradient = false, ...rest }: Props) => {
    return (
        <div className={clsx(className, 'right-summary', gradient && 'right-summary--gradient')} {...rest}>
            {children}
        </div>
    );
};

export default RightSummary;
