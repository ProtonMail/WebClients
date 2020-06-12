import { FileBrowserItem } from '../FileBrowser/FileBrowser';
import { LinkType, LinkMeta } from '../../interfaces/link';

export const selectMessageForItemList = (
    types: LinkType[],
    messages: {
        allFiles: string;
        allFolders: string;
        mixed: string;
    }
) => {
    const allFiles = types.every((type) => type === LinkType.FILE);
    const allFolders = types.every((type) => type === LinkType.FOLDER);
    const message = (allFiles && messages.allFiles) || (allFolders && messages.allFolders) || messages.mixed;

    return message;
};

export const mapLinksToChildren = (decryptedLinks: LinkMeta[]): FileBrowserItem[] => {
    return decryptedLinks.map(({ LinkID, Type, Name, ModifyTime, Size, MIMEType, ParentLinkID, Trashed }) => ({
        Name,
        LinkID,
        Type,
        ModifyTime,
        Size,
        MIMEType,
        ParentLinkID,
        Trashed
    }));
};
