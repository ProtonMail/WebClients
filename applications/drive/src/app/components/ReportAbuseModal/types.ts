import { SharedURLInfoDecrypted } from '../../hooks/drive/usePublicSharing';

export type ReportAbuseRequestPayload = {
    abuseCategory: AbuseCateroryType;
    shareURL: string;
    password: string;
    nodePassphrase: string;
    reporterEmail?: string;
    reporterMessage?: string;
};

export interface AbuseFormProps {
    onClose?: () => void;
    linkInfo: SharedURLInfoDecrypted;
    password: string;
    onSubmit: (params: {
        abuseCategory: string;
        reporterEmail?: string;
        reporterMessage?: string;
        password?: string;
        shareURL: string;
        nodePassphrase: string;
    }) => Promise<void>;
    open?: boolean;
}

export type AbuseCateroryType = 'spam' | 'copyright' | 'child-abuse' | 'stolen-data' | 'malware' | 'other';

export interface AbuseCategory {
    type: AbuseCateroryType;
    text: string;
}
