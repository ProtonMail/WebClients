import { KeyMode } from './KeyPair';

export type CertificateMode = 'session' | 'persistent';

export interface CertificateGenerationParams {
    ClientPublicKey: string;
    ClientPublicKeyMode?: KeyMode | null | undefined;
    DeviceName?: string | null | undefined;
    Duration?: string | null | undefined;
    ExpirationTime?: number | null | undefined;
    Mode?: CertificateMode | null | undefined;
    Features?: Record<string, string | number | boolean | null> | string[];
    Renew?: boolean;
}

export interface CertificateDeletionParams {
    SerialNumber?: string;
    ClientPublicKey?: string;
    ClientPublicKeyMode?: string;
    ClientPublicKeyFingerprint?: string;
    DeviceName?: string;
}

export interface CertificateDTO {
    SerialNumber: string;
    ClientKeyFingerprint: string;
    ClientKey: string;
    Certificate: string;
    ExpirationTime: number;
    RefreshTime: number;
    Mode: CertificateMode;
    ServerPublicKeyMode: KeyMode;
    ServerPublicKey: string;
    DeviceName?: string;
    Features?: Record<string, string | number | boolean | null>;
}
