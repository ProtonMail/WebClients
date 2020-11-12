import { c } from 'ttag';
import { getUnixTime } from 'date-fns';
import { LinkType, LinkMeta } from '../../interfaces/link';
import { LinkURLType, fileDescriptions } from '../../constants';
import { FileBrowserItem } from '../FileBrowser/interfaces';

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
    return decryptedLinks.map(
        ({ LinkID, Type, Name, ModifyTime, Size, MIMEType, ParentLinkID, Trashed, ShareIDs, Shared }) => ({
            Name,
            LinkID,
            Type,
            ModifyTime,
            Size,
            MIMEType,
            ParentLinkID,
            Trashed,
            Disabled: isDisabled(LinkID),
            SharedURLShareID: Shared ? ShareIDs[0] : undefined,
        })
    );
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

export const getMimeTypeDescription = (mimeType: string) => {
    if (fileDescriptions[mimeType]) {
        return fileDescriptions[mimeType];
    }
    if (mimeType.startsWith('audio/')) {
        return c('Label').t`Audio file`;
    }
    if (mimeType.startsWith('video/')) {
        return c('Label').t`Video file`;
    }
    if (mimeType.startsWith('text/')) {
        return c('Label').t`Text`;
    }
    if (mimeType.startsWith('image/')) {
        return c('Label').t`Image`;
    }

    return c('Label').t`Unknown file`;
};

// Simple math instead of addDays because we don't need to compensate for DST
export const getExpirationTime = (daysToExtendBy: number) => getUnixTime(new Date()) + daysToExtendBy * 24 * 60 * 60;
