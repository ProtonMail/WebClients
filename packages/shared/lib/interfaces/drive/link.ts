import { SORT_DIRECTION } from '../../constants';
import { FileRevisionState } from './file';

export enum LinkType {
    FOLDER = 1,
    FILE = 2,
}

export type SharedUrlInfo = {
    CreateTime: number;
    ExpireTime: number | null;
    ShareUrlID: string;
    Token: string;
};

interface FileProperties {
    ContentKeyPacket: string;
    ActiveRevision: {
        ID: string;
        CreateTime: number;
        Size: number;
        ManifestSignature: string;
        SignatureAddress: string;
        State: FileRevisionState;
        Thumbnail: number;
        ThumbnailURLInfo: {
            BareURL: string;
            Token: string;
            URL: string;
        };
    } | null;
}

interface FolderProperties {
    NodeHashKey: string;
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
    SignatureAddress: string;
    Attributes: number;
    Permissions: number;
    FileProperties: FileProperties | null;
    FolderProperties: FolderProperties | null;
    Shared: number;
    UrlsExpired: boolean;
    ShareIDs: string[];
    ShareUrls: SharedUrlInfo[];
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
}

export interface FileLinkMeta extends DriveLink {
    Type: LinkType.FILE;
    FileProperties: FileProperties;
    FolderProperties: null;
}

export interface FolderLinkMeta extends DriveLink {
    Type: LinkType.FOLDER;
    FolderProperties: FolderProperties;
    FileProperties: null;
}

export type LinkMeta = FileLinkMeta | FolderLinkMeta;

export const isFolderLinkMeta = (link: LinkMeta): link is FolderLinkMeta => link.Type === LinkType.FOLDER;

export interface LinkMetaResult {
    Link: LinkMeta;
}

export interface LinkChildrenResult {
    Links: LinkMeta[];
}

export interface HashCheckResult {
    AvailableHashes: string[];
}

export interface MoveLink {
    Name: string;
    Hash: string;
    ParentLinkID: string;
    NodePassphrase: string;
    NodePassphraseSignature: string;
    SignatureAddress: string;
}

export type DriveSectionSortKeys = keyof Pick<DriveLink, 'MIMEType' | 'ModifyTime' | 'Size' | 'Name'>;
export type SharedLinksSectionSortKeys =
    | keyof Pick<DriveLink, 'Name'>
    | keyof Pick<SharedUrlInfo, 'CreateTime' | 'ExpireTime'>;

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
