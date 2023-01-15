import { ComponentPropsWithoutRef, ReactNode } from 'react';

import { classnames } from '@proton/components';

interface Props extends ComponentPropsWithoutRef<'div'> {
    margin?: 'small';
    children: ReactNode;
    className?: string;
}

const Text = ({ children, margin, className, ...rest }: Props) => {
    return (
        <div
            className={classnames([margin === 'small' ? 'mb1' : 'mb1-75', 'text-break color-weak', className])}
            {...rest}
        >
            {children}
        </div>
    );
};

export default Text;
