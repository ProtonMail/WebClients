import { Children, Fragment, type ReactNode, isValidElement } from 'react';

import { DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';

/**
 * Separates the rows of a settings card with a divider. Rows that render nothing
 * conditionally (`false`, `null`) are skipped, so no divider is left dangling.
 */
export const SettingsCardRows = ({ children }: { children: ReactNode }) => {
    const rows = Children.toArray(children).filter(isValidElement);
    return rows.map((row, i) => (
        <Fragment key={row.key ?? i}>
            {i > 0 && <DashboardCardDivider />}
            {row}
        </Fragment>
    ));
};
