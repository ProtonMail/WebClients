import { DecryptedLink } from '../../../store';
import { SearchItem } from './Search';

export function decryptedLinkToBrowserItem(links: DecryptedLink[]): SearchItem[] {
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
            signatureIssues: link.signatureIssues,
            size: link.size,
            trashed: link.trashed,
        };
    });
}
