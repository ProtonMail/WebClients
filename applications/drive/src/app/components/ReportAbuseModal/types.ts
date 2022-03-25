import { SharedURLInfoDecrypted } from '../../hooks/drive/usePublicSharing';

export interface AbuseFormProps {
    onClose?: () => void;
    linkInfo: SharedURLInfoDecrypted;
    password?: string;
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
