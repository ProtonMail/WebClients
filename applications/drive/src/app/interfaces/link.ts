import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { FileRevisionState } from './file';

export enum LinkType {
    FOLDER = 1,
    FILE = 2,
}
interface FileProperties {
    ContentKeyPacket: string;
    ActiveRevision: {
        ID: number;
        CreateTime: number;
        Size: number;
        Hash: string;
        RootHash: string;
        RootHashSignature: string;
        SignatureAddress: string;
        State: FileRevisionState;
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
    Size: number;
    MIMEType: string;
    Hash: string;
    CreateTime: number;
    ModifyTime: number;
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

export type SortKeys = keyof Pick<DriveLink, 'MIMEType' | 'ModifyTime' | 'Size' | 'Name'>;

export type SortParams = { sortField: SortKeys; sortOrder: SORT_DIRECTION };
