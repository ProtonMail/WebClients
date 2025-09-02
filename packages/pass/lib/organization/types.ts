import type {
    MaybeNull,
    OrgMemberVaultItemReport,
    OrganizationUrlPauseEntryValues,
    UserMonitorReport,
} from '@proton/pass/types';

export type OrganizationReportDTO = { page?: number; pageSize?: number };

export type MonitorReport = Partial<UserMonitorReport> & {
    primaryEmail: string;
    emailBreachCount: number;
};

export type UsageReport = OrgMemberVaultItemReport & {
    primaryEmail: string;
    lastActivityTime?: MaybeNull<number>;
};

export type PauseListEntryAddDTO = {
    url: string;
    values: OrganizationUrlPauseEntryValues;
};

export type PauseListEntryUpdateDTO = {
    id: string;
    values: OrganizationUrlPauseEntryValues;
};

export type PauseListEntryDeleteDTO = {
    id: string;
    url: string;
};
