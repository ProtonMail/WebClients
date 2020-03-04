import { FileRevisionState } from './file';

export enum ResourceType {
    FOLDER = 1,
    FILE = 2
}
interface FileProperties {
    ContentKeyPacket: string;
}

interface FolderProperties {
    NodeHashKey: string;
}

interface DriveLink {
    LinkID: string;
    ParentLinkID: string;
    Type: ResourceType;
    Name: string;
    Size: number;
    MimeType: string;
    Hash: string;
    Created: number;
    Modified: number;
    State: number;
    NodeKey: string;
    NodePassphrase: string;
    NodePassphraseSignature: string;
    SignatureAddressID: string;
    Attributes: number;
    Permissions: number;
    FileProperties: FileProperties | null;
    FolderProperties: FolderProperties | null;
}

export interface FileLinkShortMeta extends DriveLink {
    Type: ResourceType.FILE;
    FileProperties: FileProperties;
    FolderProperties: null;
}

export interface FileLinkMeta extends FileLinkShortMeta {
    FileProperties: FileProperties & {
        ActiveRevision: {
            ID: number;
            Created: number;
            Size: number;
            Hash: string;
            RootHash: string;
            RootHashSignature: string;
            AuthorAddressID: string;
            State: FileRevisionState;
        };
    };
}

export interface FolderLinkMeta extends DriveLink {
    Type: ResourceType.FOLDER;
    FolderProperties: FolderProperties;
    FileProperties: null;
}

export type LinkMeta = FileLinkMeta | FolderLinkMeta;
export type LinkShortMeta = FolderLinkMeta | FileLinkShortMeta;

export const isFolderLinkMeta = (link: LinkMeta | LinkShortMeta): link is FolderLinkMeta =>
    link.Type === ResourceType.FOLDER;
export const isFileLinkMeta = (link: LinkMeta): link is FileLinkMeta => link.Type === ResourceType.FILE;

export interface LinkMetaResult {
    Link: LinkMeta;
}

export interface LinkChildrenResult {
    Links: LinkMeta[];
}

export interface HashCheckResult {
    AvailableHashes: string[];
}
