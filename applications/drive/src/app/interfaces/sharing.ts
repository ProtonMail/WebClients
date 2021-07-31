import { OpenPGPKey, SessionKey } from 'pmcrypto';
import { AuthVersion } from '@proton/shared/lib/authentication/interface';
import { DriveFileBlock } from './file';

export interface CreateSharedURL {
    ExpirationDuration: number | null;
    MaxAccesses: number;
    CreatorEmail: string;
    UrlPasswordSalt: string;
    SharePasswordSalt: string;
    SRPVerifier: string;
    SRPModulusID: string;
    SharePassphraseKeyPacket: string;
    Password: string;
    Permissions: number; // Only read (4) in first iteration
    Flags: number; // Unused in first iteration
}

export interface UpdateSharedURL {
    ExpirationTime: number | null;
    ExpirationDuration: number | null;
    MaxAccesses: number;
    UrlPasswordSalt: string;
    SharePasswordSalt: string;
    SRPVerifier: string;
    SRPModulusID: string;
    SharePassphraseKeyPacket: string;
    Password: string;
    Permissions: number; // Only read (4) in first iteration
    Flags: number; // Unused in first iteration
}

export interface ShareURL {
    CreatorEmail: string;
    ExpirationTime: number | null;
    Flags: number;
    LastAccessTime: number;
    MaxAccesses: number;
    NumAccesses: number;
    Password: string;
    Permissions: number;
    SRPModulusID: string;
    SRPVerifier: string;
    ShareID: string;
    ShareURLID: string;
    SharePassphraseKeyPacket: string;
    SharePasswordSalt: string;
    Token: string;
    UrlPasswordSalt: string;
}

export interface SharedURL {
    URLID: string;
    Token: string;
    ExpirationTime: number | null;
    LastAccessTime: number;
    MaxAccesses: number;
    NumAccesses: number;
    CreatorEmail: string;
    Permissions: number;
    Flags: number;
    Password: string;
    SharePassphraseKeyPacket: string;
}

export interface InitHandshake {
    Code: number;
    Modulus: string;
    ServerEphemeral: string;
    UrlPasswordSalt: string;
    SRPSession: string;
    Version: AuthVersion;
    Flags: number;
}

export interface SharedLinkInfo {
    Name: string;
    Size: number;
    MIMEType: string;
    ExpirationTime: number | null;
    NodeKey: OpenPGPKey;
    SessionKey: SessionKey;
    Blocks: DriveFileBlock[];
    ThumbnailURL?: string;
}

export interface SharedLinkPayload {
    Name: string;
    MIMEType: string;
    ExpirationTime: number | null;
    Size: number;
    ContentKeyPacket: string;
    NodeKey: string;
    NodePassphrase: string;
    ShareKey: string;
    SharePassphrase: string;
    SharePasswordSalt: string;
    Blocks: string[];
    ThumbnailURL?: string;
}

export interface SharedURLSessionKeyPayload {
    sharePasswordSalt: string;
    shareSessionKey: SessionKey;
}

export enum SharedURLFlags {
    // CustomPassword flag is set by both types, legacy and new, of custom
    // password. Legacy has set only CustomPassword, whereas the new type
    // has both CustomPassword and GeneratedPasswordIncluded. That is for
    // easier detection whether user should be asked for the password.
    // All new shares should use new logic, and the legacy mode should be
    // removed when all old shares are cancelled.
    CustomPassword = 1,
    GeneratedPasswordIncluded,
}
