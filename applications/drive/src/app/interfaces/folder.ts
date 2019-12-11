export enum LinkType {
    FOLDER = 1,
    FILE = 2
}

export interface DriveLink {
    LinkID: string;
    ParentLinkID: string;
    Name: string;
    MimeType: string;
    Hash: string;
    Type: LinkType;
    Created: number;
    Modified: number;
    Size: number;
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
