import { DecryptedLink } from '../../../store';
import { SharedLinkItem } from './SharedLinks';

export function decryptedLinkToBrowserItem(links: DecryptedLink[]): SharedLinkItem[] {
    return links.map((link) => {
        return {
            activeRevision: link.activeRevision,
            cachedThumbnailUrl: link.cachedThumbnailUrl,
            fileModifyTime: link.fileModifyTime,
            hasThumbnail: link.hasThumbnail,
            id: link.linkId,
            isFile: link.isFile,
            isLocked: link.isLocked,
            mimeType: link.mimeType,
            name: link.name,
            parentLinkId: link.parentLinkId,
            shareUrl: link.shareUrl,
            signatureAddress: link.signatureAddress,
            size: link.size,
            trashed: link.trashed,
        };
    });
}
