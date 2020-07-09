import { LinkType } from '../../interfaces/link';

export interface FileBrowserItem {
    Name: string;
    LinkID: string;
    Type: LinkType;
    ModifyTime: number;
    Trashed: number | null;
    MIMEType: string;
    Size: number;
    ParentLinkID: string;
    Location?: string;
}
