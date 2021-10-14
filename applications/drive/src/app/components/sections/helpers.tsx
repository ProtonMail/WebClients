import { c } from 'ttag';

import { LinkType, LinkMeta } from '@proton/shared/lib/interfaces/drive/link';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { LinkURLType, fileDescriptions } from '@proton/shared/lib/drive/constants';

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
        ({
            LinkID,
            Type,
            Name,
            ModifyTime,
            RealModifyTime,
            Size,
            MIMEType,
            ParentLinkID,
            Trashed,
            UrlsExpired,
            ShareIDs,
            ShareUrls,
            FileProperties,
            CachedThumbnailURL,
        }) => ({
            Name,
            LinkID,
            Type,
            ModifyTime,
            RealModifyTime,
            Size,
            ActiveRevisionSize: FileProperties?.ActiveRevision?.Size,
            MIMEType,
            ParentLinkID,
            Trashed,
            Disabled: isDisabled(LinkID),
            SharedUrl: ShareUrls[0], // Currently only one share URL is possible
            ShareUrlShareID: ShareIDs[0],
            UrlsExpired,
            HasThumbnail: FileProperties?.ActiveRevision?.Thumbnail === 1,
            CachedThumbnailURL,
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
