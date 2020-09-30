export interface ShareURL {
    CreatorEmail: string;
    ExpirationTime: number;
    Flags: number;
    LastAccessTime: number;
    MaxAccesses: number;
    NumAccesses: number;
    Password: string;
    Permissions: number;
    SRPModulusID: string;
    SRPVerifier: string;
    ShareID: string;
    SharePassphraseKeyPacket: string;
    SharePasswordSalt: string;
    Token: string;
    UrlPasswordSalt: string;
}

export interface SharedURL {
    URLID: string;
    Token: string;
    ExpirationTime: number;
    LastAccessTime: number;
    MaxAccesses: number;
    NumAccesses: number;
    CreatorEmail: string;
    Permissions: number;
    Flags: number;
    Password: string;
    SharePassphraseKeyPacket: string;
}
