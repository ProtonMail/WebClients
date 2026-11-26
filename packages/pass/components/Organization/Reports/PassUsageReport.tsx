import type { FC } from 'react';

import { PassReportFooter } from './PassReportFooter';
import { PassReportsUsageTable } from './PassReportsUsageTable';
import type { PassReportsState } from './usePassReports';

type Props = { state: PassReportsState; upgradeRequired: boolean };

export const PassUsageReport: FC<Props> = ({ state: { usage, totalMemberCount }, upgradeRequired }) => (
    <div
        className={upgradeRequired ? 'opacity-70 pointer-events-none' : ''}
        aria-disabled={upgradeRequired || undefined}
    >
        <PassReportsUsageTable reports={usage.reports} loading={usage.loading} />
        <PassReportFooter {...usage} total={totalMemberCount} upgradeRequired={upgradeRequired} />
    </div>
);
