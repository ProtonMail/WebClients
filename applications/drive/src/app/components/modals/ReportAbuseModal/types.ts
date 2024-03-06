export type ReportAbuseRequestPayload = {
    linkId: string;
    abuseCategory: AbuseCateroryType;
    reporterEmail?: string;
    reporterMessage?: string;
};

export interface AbuseFormProps {
    linkInfo: LinkInfo;
    onSubmit: (params: {
        linkId: string;
        abuseCategory: string;
        reporterEmail?: string;
        reporterMessage?: string;
    }) => Promise<void>;
    prefilled?: {
        Category?: AbuseCateroryType;
        Email?: string;
        Comment?: string;
    };
    open?: boolean;
}

export type AbuseCateroryType = 'spam' | 'copyright' | 'child-abuse' | 'stolen-data' | 'malware' | 'other';

export interface AbuseCategory {
    type: AbuseCateroryType;
    getText: () => string;
}

export interface LinkInfo {
    name: string;
    mimeType: string;
    size: number;
    linkId: string;
}
