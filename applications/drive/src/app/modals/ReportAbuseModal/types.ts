import type { NodeType } from '@proton/drive';

export enum AbuseCategoryType {
    Spam = 'spam',
    Copyright = 'copyright',
    ChildAbuse = 'child-abuse',
    StolenData = 'stolen-data',
    Malware = 'malware',
    Other = 'other',
}

export type AbuseReportPrefill = {
    category?: AbuseCategoryType;
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

export interface AbuseCategory {
    type: AbuseCategoryType;
    getText: () => string;
}
