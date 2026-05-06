import type { EncryptedLink, LinkShareUrl, SignatureIssues } from '../../../store';
import type { FileBrowserBaseItem } from '../../FileBrowser/interface';
import type { useLinkSharingModal } from '../../modals/ShareLinkModal/ShareLinkModal';

export interface DriveItem extends FileBrowserBaseItem {
    activeRevision?: EncryptedLink['activeRevision'];
    cachedThumbnailUrl?: string;
    hasThumbnail: boolean;
    isFile: boolean;
    mimeType: string;
    fileModifyTime: number;
    name: string;
    shareUrl?: LinkShareUrl;
    signatureIssues?: SignatureIssues;
    signatureEmail?: string;
    size: number;
    trashed: number | null;
    parentLinkId: string;
    isShared?: boolean;
    isAdmin: boolean;
    showLinkSharingModal?: ReturnType<typeof useLinkSharingModal>[1];
    volumeId: string;
}
