import { DriveLink } from './link';

export enum LinkType {
    FOLDER = 'folder',
    FILE = 'file'
}

export enum ResourceType {
    FOLDER = 1,
    FILE = 2
}

export interface FolderContentsResult {
    Links: DriveLink[];
}

export interface FolderMeta {
    Name: string;
    Passphrase: string;
    Key: string;
    Hash: string;
    HashKey: string;
    ParentLinkID?: string;
}

export interface FolderMetaResult {
    Folder: FolderMeta;
}
