import type { ReactNode } from 'react';

import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import clsx from '@proton/utils/clsx';

/** Spacing scale integers that map to a `gap-*` utility class (`gap-9`, `gap-1.5`, … are not valid here). */
export type ChartCardGap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 11 | 12 | 14 | 16 | 20;

interface ChartCardRootProps {
    children: ReactNode;
    gap?: ChartCardGap;
    className?: string;
}

const ChartCardRoot = ({ children, gap = 4, className }: ChartCardRootProps) => (
    <DashboardCard className={className}>
        <DashboardCardContent className="h-full">
            <div className={clsx('flex flex-column flex-nowrap h-full', `gap-${gap}`)}>{children}</div>
        </DashboardCardContent>
    </DashboardCard>
);

interface ChartCardRowProps {
    children: ReactNode;
    className?: string;
}

const ChartCardRow = ({ children, className }: ChartCardRowProps) => <div className={className}>{children}</div>;

export const ChartCard = Object.assign(ChartCardRoot, {
    Row: ChartCardRow,
});
