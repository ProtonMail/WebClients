import { DecryptedLink } from '../../../store';
import { TrashItem } from './Trash';

export function decryptedLinkToBrowserItem(links: DecryptedLink[]): TrashItem[] {
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
            signatureAddress: link.signatureAddress,
            size: link.size,
            trashed: link.trashed,
        };
    });
}
