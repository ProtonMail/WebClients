import { LinkType, LinkMeta } from '../../interfaces/link';
import { FileBrowserItem } from '../FileBrowser/interfaces';
import { LinkURLType } from '../../constants';

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

export const mapLinksToChildren = (
    decryptedLinks: LinkMeta[],
    isDisabled: (linkId: string) => boolean
): FileBrowserItem[] => {
    return decryptedLinks.map(({ LinkID, Type, Name, ModifyTime, Size, MIMEType, ParentLinkID, Trashed }) => ({
        Name,
        LinkID,
        Type,
        ModifyTime,
        Size,
        MIMEType,
        ParentLinkID,
        Trashed,
        Disabled: isDisabled(LinkID),
    }));
};

export const toLinkURLType = (type: LinkType) => {
    const linkType = {
        [LinkType.FILE]: LinkURLType.FILE,
        [LinkType.FOLDER]: LinkURLType.FOLDER,
    }[type];

    if (!linkType) {
        throw new Error(`Type ${type} is unexpected, must be integer representing link type`);
    }

    return linkType;
};
