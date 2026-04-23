import type { ElementType, ReactNode } from 'react';

import type { PolymorphicPropsWithoutRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';

interface DashboardCardOwnProps {
    rounded?: boolean | 'md' | 'lg' | 'xl';
}

export type DashboardCardProps<E extends ElementType> = PolymorphicPropsWithoutRef<DashboardCardOwnProps, E>;

const defaultElement = 'div';

export const DashboardCardImage = ({ children, className }: { children: ReactNode; className?: string }) => {
    return <div className={clsx('DashboardCard-image w-full', className)}>{children}</div>;
};

export const DashboardCardContent = ({
    children,
    paddingClass = 'p-4 md:p-6',
    className,
    style,
}: {
    children: ReactNode;
    paddingClass?: string;
    className?: string;
    style?: React.CSSProperties;
}) => {
    return (
        <div className={clsx('DashboardCard-content relative', paddingClass, className)} style={style}>
            {children}
        </div>
    );
};

export const DashboardCardDivider = () => {
    return (
        <>
            <div className="DashboardCard-divider-before block pt-4 md:pt-6" />
            <hr
                className="DashboardCard-divider-line absolute w-full left-0 right-0 h-px"
                style={{ backgroundColor: 'var(--border-weak)' }}
            />
            <div className="DashboardCard-divider-after block pb-4 md:pb-6" />
        </>
    );
};

export const DashboardCard = <E extends ElementType = typeof defaultElement>({
    className,
    as,
    children,
    rounded = 'xl',
}: DashboardCardProps<E>) => {
    const Element: ElementType = as || defaultElement;

    const roundedClass = (() => {
        switch (true) {
            case rounded === true:
                return 'rounded';
            case rounded === 'md':
                return 'rounded';
            case rounded === 'lg':
                return 'rounded-lg';
            case rounded === 'xl':
                return 'rounded-xl';
            default:
                return '';
        }
    })();

    return (
        <Element
            className={clsx(
                'DashboardCard bg-elevated overflow-hidden shadow-norm w-full h-full',
                roundedClass,
                className
            )}
        >
            {children}
        </Element>
    );
};
