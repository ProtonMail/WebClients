import type { FC } from 'react';

import { PassReportFooter } from './PassReportFooter';
import { PassReportsMonitorTable } from './PassReportsMonitorTable';
import type { PassReportsState } from './usePassReports';

type Props = { state: PassReportsState; upgradeRequired: boolean };

export const PassMonitorReport: FC<Props> = ({ state: { monitor, totalMemberCount }, upgradeRequired }) => (
    <div
        className={upgradeRequired ? 'opacity-70 pointer-events-none' : ''}
        aria-disabled={upgradeRequired || undefined}
    >
        <PassReportsMonitorTable reports={monitor.reports} loading={monitor.loading} />
        <PassReportFooter {...monitor} total={totalMemberCount} upgradeRequired={upgradeRequired} />
    </div>
);
