import type { AbuseCategory } from '@proton/drive';

export type AbuseReportPrefill = {
    category?: AbuseCategory;
    email?: string;
    comment?: string;
};
