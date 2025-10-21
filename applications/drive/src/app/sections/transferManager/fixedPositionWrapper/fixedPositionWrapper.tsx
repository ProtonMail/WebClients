import type { HTMLAttributes, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './FixedPositionWrapper.scss';

type FixedPositionWrapperProps = {
    children: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export const FixedPositionWrapper = ({ children, className, ...rest }: FixedPositionWrapperProps) => {
    return (
        <div className={clsx('transfer-manager-fixed-position', className)} {...rest}>
            {children}
        </div>
    );
};
