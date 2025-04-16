import type { SORT_DIRECTION } from '../../constants';
import type { DriveFileRevisionPayload, PhotoTag } from './file';

export enum LinkType {
    FOLDER = 1,
    FILE = 2,
    ALBUM = 3,
}

export enum LinkState {
    DRAFT = 0,
    ACTIVE = 1,
    TRASHED = 2,
}

export type LinkSharedUrlInfo = {
    CreateTime: number;
    ExpireTime: number | null;
    ShareUrlID: string;
    Token: string;
    NumAccesses?: number;
};

export type SharingDetails = {
    ShareUrl: LinkSharedUrlInfo | null;
    ShareID: string;
};

interface FileProperties {
    ContentKeyPacket: string;
    ContentKeyPacketSignature: string;
    ActiveRevision: DriveFileRevisionPayload | null;
}

interface FolderProperties {
    NodeHashKey: string;
}

interface AlbumProperties {
    NodeHashKey: string;
    CoverLinkID: string;
    PhotoCount: number;
    LastActivityTime: number;
    Locked: boolean;
}

interface PhotoProperties {
    Albums: {
        AlbumLinkID: string;
        Hash: string;
        ContentHash: string;
        AddedTime: number;
    }[];
    Tags: PhotoTag[];
}

interface DocumentProperties {
    Size: number;
}

interface DriveLink {
    LinkID: string;
    ParentLinkID: string;
    Type: LinkType;
    Name: string;
    NameSignatureEmail: string;
    EncryptedName: string;
    Size: number;
    MIMEType: string;
    Hash: string;
    CreateTime: number;
    // API returns only ModifyTime which represents modification on API, i.e.,
    // the time when the last revision was uploaded. The real modification time
    // (set by file system) is available in XAttr and these times are properly
    // set during decryption of the link.
    ModifyTime: number;
    RealModifyTime: number;
    Trashed: number | null;
    State: number;
    NodeKey: string;
    NodePassphrase: string;
    NodePassphraseSignature: string;
    SignatureEmail: string;
    Attributes: number;
    Permissions: number;
    FileProperties: FileProperties | null;
    FolderProperties: FolderProperties | null;
    AlbumProperties: AlbumProperties | null;
    PhotoProperties: PhotoProperties | null;
    DocumentProperties: DocumentProperties | null;
    Shared: number;
    ShareIDs: string[];
    ShareUrls: LinkSharedUrlInfo[];
    SharingDetails: SharingDetails | null;
    // XAttr has following JSON structure encrypted by node key:
    // {
    //    Common: {
    //        ModificationTime: "2021-09-16T07:40:54+0000",
    //        Size: 13283,
    //    },
    // }
    XAttr: string;
    // CachedThumbnailURL is computed URL to cached image. This is not part
    // of any request and not filled automatically. To get this value, use
    // `loadLinkThumbnail` from `useDrive`.
    CachedThumbnailURL: string;
    ThumbnailIsLoading: boolean;
    VolumeID: string;
}

interface FileLinkMeta extends DriveLink {
    Type: LinkType.FILE;
    FileProperties: FileProperties;
    FolderProperties: null;
    PhotoProperties: PhotoProperties | null;
}

interface FolderLinkMeta extends DriveLink {
    Type: LinkType.FOLDER;
    FolderProperties: FolderProperties;
    FileProperties: null;
}

interface AlbumLinkMeta extends DriveLink {
    Type: LinkType.ALBUM;
    FolderProperties: null;
    FileProperties: null;
    AlbumProperties: AlbumProperties;
}

export type LinkMeta = FileLinkMeta | FolderLinkMeta | AlbumLinkMeta;

export interface LinkMetaResult {
    Link: LinkMeta;
}

export interface LinkChildrenResult {
    Links: LinkMeta[];
}

export interface HashCheckResult {
    AvailableHashes: string[];
    PendingHashes: {
        ClientUID: string;
        Hash: string;
        LinkID: string;
        RevisionID: string;
    }[];
}

export interface MoveLink {
    Name: string;
    Hash: string;
    ParentLinkID: string;
    NodePassphrase: string;
    NodePassphraseSignature?: string;
    NameSignatureEmail: string;
    NewShareID?: string;
    ContentHash?: string;
}

export interface RecoverPhotoLinks {
    ParentLinkID: string;
    Links: MoveLink[];
    NameSignatureEmail: string;
    SignatureEmail: string;
    NewShareId: string;
}

export type TransferPhotoLinks = Omit<RecoverPhotoLinks, 'NewShareId'>;

export type MoveLinks = RecoverPhotoLinks;

export interface MultipleMoveResponse {
    LinkID: string;
    Responses: {
        LinkID: string;
        Response: {
            Code: number;
            Error: string;
        };
    }[];
}

export type DriveSectionSortKeys = keyof Pick<DriveLink, 'MIMEType' | 'ModifyTime' | 'Size' | 'Name'>;
export type SharedLinksSectionSortKeys =
    | keyof Pick<DriveLink, 'Name'>
    | keyof Pick<LinkSharedUrlInfo, 'CreateTime' | 'ExpireTime'>;

export type AllSortKeys = DriveSectionSortKeys | SharedLinksSectionSortKeys;

export type SortParams<T extends AllSortKeys = AllSortKeys> = {
    sortField: T;
    sortOrder: SORT_DIRECTION;
};

export interface ShareMapLink {
    CreateTime: number;
    Hash: string;
    Index: number;
    LinkID: string;
    MIMEType: string;
    ModifyTime: number;
    Name: string;
    ParentLinkID: string | null;
    Size: number;
    State: number;
    Type: LinkType;
    // These will be missing for Link.Type !== LinkType.FOLDER
    NodeKey?: string;
    NodePassphrase?: string;
    NodePassphraseSignature?: string;
    NodePassphraseSignatureEmail?: string;
}

export interface ShareMapPayload {
    Links: ShareMapLink[];
    SessionName: string;
    More: 0 | 1;
    Total: number;
}

export interface LinkMetaBatchPayload {
    Links: LinkMeta[];
    Parents: LinkMeta[];
}
