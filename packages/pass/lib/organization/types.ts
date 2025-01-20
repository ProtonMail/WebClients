import type { MaybeNull, OrgMemberVaultItemReport, UserMonitorReport } from '@proton/pass/types';

export type OrganizationReportDTO = { page?: number; pageSize?: number };

export type MonitorReport = Partial<UserMonitorReport> & {
    primaryEmail: string;
    emailBreachCount: number;
};

export type UsageReport = OrgMemberVaultItemReport & {
    primaryEmail: string;
    lastActivityTime?: MaybeNull<number>;
};
