import { OpenPGPKey, SessionKey } from 'pmcrypto';
import { AuthVersion } from 'proton-shared/lib/authentication/interface';
import { DriveFileBlock } from './file';

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

export interface InitHandshake {
    Code: number;
    Modulus: string;
    ServerEphemeral: string;
    UrlPasswordSalt: string;
    SRPSession: string;
    Version: AuthVersion;
}

export interface SharedLinkInfo {
    Name: string;
    Size: number;
    MIMEType: string;
    ExpirationTime: number;
    NodeKey: OpenPGPKey;
    SessionKey: SessionKey;
    Blocks: DriveFileBlock[];
}

export interface SharedLinkPayload {
    Name: string;
    MIMEType: string;
    ExpirationTime: number;
    Size: number;
    ContentKeyPacket: string;
    NodeKey: string;
    NodePassphrase: string;
    ShareKey: string;
    SharePassphrase: string;
    SharePasswordSalt: string;
    Blocks: string[];
}
