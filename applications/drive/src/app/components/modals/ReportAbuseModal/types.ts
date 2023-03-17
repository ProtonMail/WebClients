export type ReportAbuseRequestPayload = {
    linkId: string;
    abuseCategory: AbuseCateroryType;
    reporterEmail?: string;
    reporterMessage?: string;
};

export interface AbuseFormProps {
    onClose?: () => void;
    linkInfo: LinkInfo;
    onSubmit: (params: {
        linkId: string;
        abuseCategory: string;
        reporterEmail?: string;
        reporterMessage?: string;
    }) => Promise<void>;
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
