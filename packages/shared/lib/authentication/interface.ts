import type { AuthenticationCredentialsPayload, AuthenticationOptions, RegisteredKey } from '../webauthn/interface';
import type { SessionAccessTypeMask } from './sessionAccessType';

export interface Fido2Response {
    AuthenticationOptions: AuthenticationOptions;
    RegisteredKeys: RegisteredKey[];
}

export type Fido2Data = AuthenticationCredentialsPayload;

interface TwoFaResponse {
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
    SSOBackupPasswordDisabled?: boolean;
    FirstLoginAfterConversion?: boolean;
    LocalID: number;
    TwoFactor: number;
    '2FA': TwoFaResponse;
    HasRecoveryEmail: boolean;
    HasRecoveryPhone: boolean;
    HasRecoveryPhrase: boolean;
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
    Scopes: string[];
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
    UID: string;
    Username?: string;
    DisplayName: string;
    LocalID: number;
    UserID: string;
    PrimaryEmail?: string;
    AccessType: SessionAccessTypeMask;
}

export type AuthVersion = 0 | 1 | 2 | 3 | 4;

export interface ChallengePayload {
    [key: string]: string;
}

/**
 * Short, encrypted IDs of the disabled addresses that were claimed when their domain got registered
 * by an organization. They are deliberately encrypted differently from the address IDs the account
 * itself sees, so that they can't be correlated back to the user's own addresses.
 *
 * Each ID is sent back as `ClaimedAddressID` to `POST /auth/info` and `POST /auth`, with the email it
 * was returned for as `Username`, to authenticate against the account the claimed address belonged to.
 * An SRP challenge can only be consumed once, so a caller has to retry per candidate ID.
 */
export type ClaimedAddressID = string;

export interface InfoResponse {
    Modulus: string;
    ServerEphemeral: string;
    Version: AuthVersion;
    Salt: string;
    SRPSession: string;
    ClaimedAddresses?: ClaimedAddressID[];
}

export interface SSOInfoResponse {
    SSOChallengeToken: string;
    ClaimedAddresses?: ClaimedAddressID[];
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

export interface ExtraSessionForkData {
    localID?: number;
    email?: string | null;
    returnUrl?: string;
    pathname?: string;
    reloadDocument?: boolean;
    unauthenticatedReturnUrl?: string;
}
