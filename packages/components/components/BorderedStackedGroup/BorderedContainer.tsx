import type { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

export interface BorderedContainerProps extends ComponentPropsWithoutRef<'div'> {
    children: React.ReactNode;
    className?: string;
}

export const BorderedContainer = ({ children, className, ...rest }: BorderedContainerProps) => {
    return (
        <div
            className={clsx(
                'border border-weak rounded-xl divide-y divide-weak flex flex-column flex-nowrap',
                className
            )}
            {...rest}
        >
            {children}
        </div>
    );
};

export interface BorderedContainerItemProps extends ComponentPropsWithoutRef<'div'> {
    children: React.ReactNode;
    className?: string;
    paddingClassName?: string;
}

export const BorderedContainerItem = ({
    children,
    className,
    paddingClassName = 'py-3 px-5',
    ...rest
}: BorderedContainerItemProps) => {
    return (
        <div className={clsx(paddingClassName, className)} {...rest}>
            {children}
        </div>
    );
};
