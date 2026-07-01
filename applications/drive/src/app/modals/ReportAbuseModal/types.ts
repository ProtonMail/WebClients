import type { AbuseCategory, NodeType } from '@proton/drive';

export type { AbuseCategory };

export type AbuseReportPrefill = {
    category?: AbuseCategory;
    email?: string;
    comment?: string;
};

export interface AbuseFormProps {
    type: NodeType;
    size: number | undefined;
    name: string;
    mediaType: string | undefined;
    prefilled?: AbuseReportPrefill;
    open?: boolean;
}

export interface AbuseCategoryEntry {
    type: AbuseCategory;
    getText: () => string;
}
