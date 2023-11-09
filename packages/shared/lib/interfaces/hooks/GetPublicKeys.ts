import { ApiKeysConfig } from '../EncryptionPreferences';

export type GetPublicKeys = ({
    email,
    lifetime,
    internalKeysOnly,
    includeInternalKeysWithE2EEDisabledForMail,
    noCache,
}: {
    email: string;
    lifetime?: number;
    internalKeysOnly?: boolean;
    /**
     * Whether to return internal keys which cannot be used for email encryption, as the owner has disabled E2EE.
     * These keys may still be used for e.g. calendar sharing or message verification.
     **/
    includeInternalKeysWithE2EEDisabledForMail?: boolean;
    noCache?: boolean;
}) => Promise<ApiKeysConfig>;
