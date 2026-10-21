import type { AbuseCategory } from '@proton/drive/sdk';

export type AbuseReportPrefill = {
    category?: AbuseCategory;
    email?: string;
    comment?: string;
};
