import { ResourceType } from './folder';

export interface DriveLink {
    LinkID: string;
    ParentLinkID: string;
    Name: string;
    Size: number;
    MimeType: string;
    Hash: string;
    Type: ResourceType;
    Created: number;
    Modified: number;
    State: number;
    NodeKey: string;
    NodeHashKey: string;
    NodePassphrase: string;
}

export interface DriveLinkResult {
    Link: DriveLink;
}
