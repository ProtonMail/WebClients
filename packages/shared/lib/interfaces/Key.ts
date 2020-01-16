export interface Key {
    ID: string;
    Primary: number;
    Flags: number;
    Fingerprint: string;
    Fingerprints: string[];
    PublicKey: string;
    Version: number;
    Activation?: string;
    PrivateKey: string;
    Token?: string;
    Signature: string;
}
