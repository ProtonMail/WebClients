import { ApiKeysConfig } from '../EncryptionPreferences';

export type GetPublicKeys = ({
    email,
    lifetime,
    internalKeysOnly,
    noCache,
}: {
    email: string;
    lifetime?: number;
    internalKeysOnly?: boolean;
    noCache?: boolean;
}) => Promise<ApiKeysConfig>;
