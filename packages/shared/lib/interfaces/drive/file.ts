export enum FileRevisionState {
    Draft = 0,
    Active = 1,
    Inactive = 2,
}

export interface CreateDriveFile {
    Name: string;
    Hash: string;
    ParentLinkID: string;
    NodePassphrase: string;
    NodePassphraseSignature: string;
    SignatureAddress: string;
    NodeKey: string;
    MIMEType: string;
    ContentKeyPacket: string;
    ContentKeyPacketSignature: string;
    ClientUID?: string;
}

export interface RevisionManifest {
    PreviousRootHash: string;
    BlockHashes: {
        Hash: string;
        Index: number;
    }[];
}

export interface UpdateFileRevision {
    ManifestSignature: string;
    SignatureAddress: string;
    XAttr?: string;
    Photo?: {
        MainPhotoLinkID: string | null;
        CaptureTime: number;
        Exif?: string;
        ContentHash?: string;
    };
}

export interface CreateFileResult {
    File: {
        ID: string;
        RevisionID: string;
    };
    AuthorizationToken?: string;
}

export interface CreateFileRevisionResult {
    Revision: {
        ID: string;
    };
}

export interface UploadLink {
    Token: string;
    BareURL: string;
}

export interface RequestUploadResult {
    UploadLinks: UploadLink[];
    ThumbnailLinks?: UploadLink[];
}

export interface DriveFileBlock {
    Index: number;
    EncSignature?: string;
    BareURL: string;
    Token: string;
    Hash: string;
}

export type Thumbnail = { ThumbnailID: string; Size: number; Type: number; Hash: string };

export interface DriveFileRevisionPayload {
    ID: string;
    CreateTime: number;
    Size: number;
    State: number;
    ManifestSignature: string;
    SignatureAddress: string;
    SignatureEmail: string;
    Blocks: DriveFileBlock[];
    Thumbnails: Thumbnail[];
    XAttr: string;
}

export interface DriveFileRestoreRevisionResult {
    Code: 1000 | 1002; // 1000: restore sync, 1002: restore async
}

export interface DriveFileRevisionsResult {
    Revisions: DriveFileRevisionPayload[];
}

export interface DriveFileRevisionResult {
    Revision: DriveFileRevisionPayload;
}

export interface DriveFileRevisionThumbnailResult {
    ThumbnailLink: string;
    ThumbnailBareURL: string;
    ThumbnailToken: string;
}

export interface GetVerificationDataResult {
    VerificationCode: string;
    ContentKeyPacket: string;
}

export interface ScanResultItem {
    Hash: string;
    Error?: string;
    Safe: boolean;
}

/** Public **/
export interface PublicCreateDriveFile {
    Name: string;
    Hash: string;
    ParentLinkID: string;
    NodePassphrase: string;
    NodePassphraseSignature: string;
    SignatureEmail?: string;
    NodeKey: string;
    MIMEType: string;
    ContentKeyPacket: string;
    ContentKeyPacketSignature?: string;
    ClientUID?: string;
}
