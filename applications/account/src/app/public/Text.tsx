import { ComponentPropsWithoutRef, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props extends ComponentPropsWithoutRef<'div'> {
    margin?: 'small';
    children: ReactNode;
    className?: string;
}

const Text = ({ children, margin, className, ...rest }: Props) => {
    return (
        <div className={clsx(margin === 'small' ? 'mb-4' : 'mb-6', 'text-break color-weak', className)} {...rest}>
            {children}
        </div>
    );
};

export default Text;
