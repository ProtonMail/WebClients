import { FileRevisionState } from './file';

export enum ResourceType {
    FOLDER = 1,
    FILE = 2
}
interface FileProperties {
    ContentKeyPacket: string;
    ActiveRevision: {
        ID: number;
        Created: number;
        Size: number;
        Hash: string;
        RootHash: string;
        RootHashSignature: string;
        AuthorAddressID: string;
        State: FileRevisionState;
    } | null;
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

export interface FileLinkMeta extends DriveLink {
    Type: ResourceType.FILE;
    FileProperties: FileProperties;
    FolderProperties: null;
}

export interface FolderLinkMeta extends DriveLink {
    Type: ResourceType.FOLDER;
    FolderProperties: FolderProperties;
    FileProperties: null;
}

export type LinkMeta = FileLinkMeta | FolderLinkMeta;

export const isFolderLinkMeta = (link: LinkMeta): link is FolderLinkMeta => link.Type === ResourceType.FOLDER;

export interface LinkMetaResult {
    Link: LinkMeta;
}

export interface LinkChildrenResult {
    Links: LinkMeta[];
}

export interface HashCheckResult {
    AvailableHashes: string[];
}
