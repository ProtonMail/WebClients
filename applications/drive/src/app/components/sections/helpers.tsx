import { c } from 'ttag';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { LinkURLType, fileDescriptions } from '@proton/shared/lib/drive/constants';

import { DecryptedLink, LinkType } from '../../store';

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

// TODO: Deprecated!
// This helper is just to make less changes in components with cache refactor.
// Remove it once all is converted to DecryptedLink instead of FileBrowserItem.
export const mapDecryptedLinksToChildren = (decryptedLinks: DecryptedLink[]): FileBrowserItem[] => {
    return decryptedLinks.map((link) => ({
        Name: link.name,
        LinkID: link.linkId,
        Type: link.type,
        CreateTime: link.createTime,
        ModifyTime: link.metaDataModifyTime,
        RealModifyTime: link.fileModifyTime,
        Size: link.size,
        ActiveRevisionSize: link.activeRevision?.size,
        MIMEType: link.mimeType,
        ParentLinkID: link.parentLinkId,
        Trashed: link.trashed,
        Disabled: link.isLocked || false,
        SharedUrl: link.shareUrl
            ? {
                  CreateTime: link.shareUrl.createTime,
                  ExpireTime: link.shareUrl.expireTime,
                  ShareUrlID: link.shareUrl.id,
                  Token: link.shareUrl.token,
                  NumAccesses: link.shareUrl.numAccesses,
              }
            : undefined,
        ShareUrlShareID: link.shareId,
        UrlsExpired: link.shareUrl?.isExpired || false,
        HasThumbnail: link.hasThumbnail,
        CachedThumbnailURL: link.cachedThumbnailUrl,
        SignatureAddress: link.signatureAddress,
        SignatureIssues: link.signatureIssues,
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
