export interface U2FKeyResponse {
    Version: string;
    KeyHandle: string;
}

export interface U2FResponse {
    Challenge: string;
    RegisteredKeys: U2FKeyResponse[];
}

export interface TwoFaResponse {
    Enabled: number;
    U2F: null | U2FResponse;
    TOTP: number;
}

export interface AuthResponse {
    AccessToken: string;
    ExpiresIn: number;
    TokenType: string;
    Scope: string;
    UID: string;
    UserID: string;
    RefreshToken: string;
    EventID: string;
    PasswordMode: number;
    LocalID: number;
    TwoFactor: number;
    '2FA': TwoFaResponse;
}

export type AuthVersion = 0 | 1 | 2 | 3 | 4;

export interface InfoResponse {
    Modulus: string;
    ServerEphemeral: string;
    Version: AuthVersion;
    Salt: string;
    SRPSession: string;
}

export interface InfoAuthedResponse extends InfoResponse {
    '2FA': TwoFaResponse;
}

export interface ModulusResponse {
    Modulus: string;
    ModulusID: string;
}
