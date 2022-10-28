import { AuthenticationCredentialsPayload, AuthenticationOptions, RegisteredKey } from '../webauthn/interface';

export interface Fido2Response {
    AuthenticationOptions: AuthenticationOptions;
    RegisteredKeys: RegisteredKey[];
}

export type Fido2Data = AuthenticationCredentialsPayload;

export interface TwoFaResponse {
    Enabled: number;
    FIDO2: Fido2Response | null;
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
    TemporaryPassword: 0 | 1;
    PasswordMode: number;
    LocalID: number;
    TwoFactor: number;
    '2FA': TwoFaResponse;
}

export interface PushForkResponse {
    Selector: string;
}

export interface PullForkResponse {
    Payload: string;
    LocalID: number;
    UID: string;
    AccessToken: string;
    RefreshToken: string;
    ExpiresIn: number;
    TokenType: string;
    UserID: string;
}

export interface RefreshSessionResponse {
    AccessToken: string;
    ExpiresIn: number;
    TokenType: string;
    Scope: string;
    UID: string;
    RefreshToken: string;
}

export interface LocalSessionResponse {
    Username?: string;
    DisplayName: string;
    LocalID: number;
    UserID: string;
    PrimaryEmail?: string;
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

export interface LocalKeyResponse {
    ClientKey: string;
}

export interface MemberAuthResponse {
    UID: string;
    LocalID: number;
}
