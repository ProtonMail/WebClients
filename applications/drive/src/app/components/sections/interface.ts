import type { useSharingModal } from '../../modals/SharingModal/SharingModal';
import type { EncryptedLink, ExtendedInvitationDetails, LinkShareUrl, SignatureIssues } from '../../store';
import type { FileBrowserBaseItem } from '../FileBrowser';

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
    showLinkSharingModal?: ReturnType<typeof useSharingModal>['showSharingModal'];
    volumeId: string;
}

export interface DeviceItem extends FileBrowserBaseItem {
    modificationTime: number;
    name: string;
}

export interface SharedLinkItem extends FileBrowserBaseItem {
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
    rootShareId: string;
    sharedOn?: number;
    volumeId: string;
}

export interface SharedWithMeItem extends FileBrowserBaseItem {
    activeRevision?: EncryptedLink['activeRevision'];
    cachedThumbnailUrl?: string;
    hasThumbnail?: boolean;
    isFile: boolean;
    mimeType: string;
    name: string;
    signatureIssues?: SignatureIssues;
    signatureEmail?: string;
    size: number;
    trashed: number | null;
    rootShareId: string;
    volumeId: string;
    sharedOn?: number;
    sharedBy?: string;
    parentLinkId: string;
    invitationDetails?: ExtendedInvitationDetails;
    bookmarkDetails?: { token: string; createTime: number; urlPassword: string };
}

export interface TrashItem extends FileBrowserBaseItem {
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
    rootShareId: string;
    sharedOn?: number;
}
