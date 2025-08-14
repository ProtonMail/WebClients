import type { ElementType, ReactNode } from 'react';

import type { PolymorphicPropsWithoutRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';

import './DashboardGrid.scss';

interface DashboardGridOwnProps {
    columns?: number;
}

export type DashboardGridProps<E extends ElementType> = PolymorphicPropsWithoutRef<DashboardGridOwnProps, E>;

const defaultElement = 'section';

interface DashboardGridSectionProps {
    children: ReactNode;
    position?:
        | 'header-left'
        | 'header-center'
        | 'header-right'
        | 'content-left'
        | 'content-center'
        | 'content-right'
        | 'footer-left'
        | 'footer-center'
        | 'footer-right';
    spanAll?: 'header' | 'content' | 'footer';
}

export const DashboardGridSection = ({ children, position, spanAll }: DashboardGridSectionProps) => {
    return (
        <div
            className={clsx(
                'DashboardGrid-Section h-full w-full',
                position && `DashboardGrid-Section-${position}`,
                spanAll && `DashboardGrid-Section-${spanAll}-span-all`
            )}
        >
            {children}
        </div>
    );
};

export const DashboardGridSectionCta = ({ children }: { children: ReactNode }) => {
    return <div className="DashboardGrid-SectionCta">{children}</div>;
};

export const DashboardGridSectionTitle = ({
    children,
    center,
    cta,
    className,
}: {
    children: ReactNode;
    center?: ReactNode;
    cta?: ReactNode;
    className?: string;
}) => {
    return (
        <div className={clsx("DashboardGrid-SectionTitle flex gap-2 lg:flex-nowrap justify-space-between", className)}>
            <h2 className="m-0 text-2xl text-semibold">{children}</h2>
            {center && <div>{center}</div>}
            {cta && <DashboardGridSectionCta>{cta}</DashboardGridSectionCta>}
        </div>
    );
};

export const DashboardGridSectionSubtitle = ({ children }: { children: ReactNode }) => {
    return <p className="DashboardGrid-SectionSubtitle m-0 color-weak text-rg">{children}</p>;
};

export const DashboardGridSectionHeader = ({
    title,
    subtitle,
    className,
    titleClassName,
    center,
    cta,
}: {
    title: ReactNode;
    subtitle?: ReactNode;
    className?: string;
    titleClassName?: string;
    center?: ReactNode;
    cta?: ReactNode;
}) => {
    return (
        <div className={clsx('DashboardGrid-SectionHeader', className)}>
            <DashboardGridSectionTitle cta={cta} center={center} className={titleClassName}>
                {title}
            </DashboardGridSectionTitle>
            <DashboardGridSectionSubtitle>{subtitle}</DashboardGridSectionSubtitle>
        </div>
    );
};

export const DashboardGrid = <E extends ElementType = typeof defaultElement>({
    className,
    as,
    children,
    columns,
}: DashboardGridProps<E>) => {
    const Element: ElementType = as || defaultElement;
    const validatedColumns = columns && columns > 3 ? 3 : columns;

    return (
        <Element
            className={clsx(
                'DashboardGrid mb-4',
                className,
                validatedColumns ? `DashboardGrid-columns-${validatedColumns}` : undefined
            )}
        >
            {children}
        </Element>
    );
};
