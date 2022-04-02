export interface Certificate {
    id: string;
    name?: string | null | undefined;
    serialNumber?: string;
    privateKey?: string;
    publicKey: string;
    publicKeyFingerprint: string;
    expirationTime: number;
    config?: string;
    features?: Record<string, string | number | boolean | null>;
}
