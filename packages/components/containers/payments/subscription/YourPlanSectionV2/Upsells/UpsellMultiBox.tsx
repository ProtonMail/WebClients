import type { ElementType, ReactNode } from 'react';

import { DashboardCard } from '@proton/atoms/DashboardCard/DashboardCard';
import type { PolymorphicPropsWithoutRef } from '@proton/react-polymorphic-types';
import clsx from '@proton/utils/clsx';

import './UpsellMultiBox.scss';

export type UpsellMultiBoxGradientType = 'vpn' | 'unlimited';

interface UpsellMultiBoxGradientProps {
    children: ReactNode;
    gradient?: UpsellMultiBoxGradientType;
}

const UpsellMultiBoxGradient = ({ children, gradient }: UpsellMultiBoxGradientProps) => {
    return <div className={clsx(gradient && `UpsellMultiBox-gradient-${gradient} p-4 rounded-xl`)}>{children}</div>;
};

interface Props {
    header: ReactNode;
    headerActionArea?: ReactNode;
    upsellPanels?: ReactNode;
    upsellGradient?: UpsellMultiBoxGradientType;
    contentArea?: ReactNode;
    ['data-testid']?: string;
    style?: 'card' | 'promotionGradient';
}

export type UpsellMultiBoxProps<E extends ElementType> = PolymorphicPropsWithoutRef<Props, E>;

const defaultElement = 'div';

const UpsellMultiBox = <E extends ElementType = typeof defaultElement>({
    header,
    headerActionArea,
    upsellPanels,
    contentArea,
    upsellGradient,
    style,
    as,
    'data-testid': dataTestId,
}: UpsellMultiBoxProps<E>) => {
    let Element: ElementType = as || defaultElement;

    if (style === 'card') {
        Element = DashboardCard;
    }

    return (
        <Element>
            <div
                className={clsx(
                    'UpsellMultiBox rounded-xl p-4 md:p-6 flex flex-column gap-4 md:gap-6',
                    style && `UpsellMultiBox-style-${style}`
                )}
                data-testid={dataTestId}
            >
                <div className="flex flex-column lg:flex-row lg:justify-space-between lg:items-center gap-4 flex-nowrap">
                    <div>{header}</div>
                    <div className="flex flex-column gap-2 lg:flex-row lg:flex-nowrap lg:justify-end max-w-fit-content">
                        {headerActionArea}
                    </div>
                </div>
                {contentArea}
                {upsellPanels && (
                    <UpsellMultiBoxGradient gradient={upsellGradient}>{upsellPanels}</UpsellMultiBoxGradient>
                )}
            </div>
        </Element>
    );
};

export default UpsellMultiBox;
