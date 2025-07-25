import type { ShareExternalInvitation, ShareInvitation, ShareMember } from '../../store';
import type { LockedVolumeForRestore, Share, ShareWithKey } from '../../store';

export interface MembersState {
    _shareMembers: Map<string, ShareMember[]>;
    // Members Actions
    setShareMembers: (shareId: string, members: ShareMember[]) => void;
    getShareMembers: (shareId: string) => ShareMember[];
}

export interface InvitationsState {
    _sharesInvitations: Map<string, ShareInvitation[]>;
    _sharesExternalInvitations: Map<string, ShareExternalInvitation[]>;

    // Invitations Actions
    setShareInvitations: (shareId: string, invitations: ShareInvitation[]) => void;
    getShareInvitations: (shareId: string) => ShareInvitation[];
    removeShareInvitations: (shareId: string, invitations: ShareInvitation[]) => void;
    updateShareInvitationsPermissions: (shareId: string, invitations: ShareInvitation[]) => void;

    // External Invitations Actions
    setShareExternalInvitations: (shareId: string, invitations: ShareExternalInvitation[]) => void;
    getShareExternalInvitations: (shareId: string) => ShareExternalInvitation[];
    removeShareExternalInvitations: (shareId: string, invitations: ShareExternalInvitation[]) => void;
    updateShareExternalInvitations: (shareId: string, invitations: ShareExternalInvitation[]) => void;

    // Mixed Invitations Actions
    addMultipleShareInvitations: (
        shareId: string,
        invitations: ShareInvitation[],
        externalInvitations: ShareExternalInvitation[]
    ) => void;
}
export interface SharesState {
    shares: Record<string, Share | ShareWithKey>;
    lockedVolumesForRestore: LockedVolumeForRestore[];
    setShares: (shares: (Share | ShareWithKey)[]) => void;
    removeShares: (shareIds: string[]) => void;
    getShare: (shareId: string) => Share | ShareWithKey | undefined;
    getLockedSharesByVolume: () => Map<
        string,
        {
            defaultShares: (Share | ShareWithKey)[];
            devices: (Share | ShareWithKey)[];
            photos: (Share | ShareWithKey)[];
        }
    >;
    haveLockedOrRestoredOldPhotosShare: () => boolean;
    getDefaultShareId: () => string | undefined;
    getDefaultPhotosShareId: () => string | undefined;
    getDefaultShareEmail: () => string | undefined;
    getRestoredPhotosShares: () => (Share | ShareWithKey)[];
    setLockedVolumesForRestore: (volumes: LockedVolumeForRestore[]) => void;

    // This set of actions are to ensure we load default shares and photo shares only once
    loadUserSharesPromise: Promise<{ defaultShareId?: string; shares: Share[] }> | null;
    defaultSharePromise: Promise<ShareWithKey> | null;
    defaultPhotosSharePromise: Promise<ShareWithKey | undefined> | null;
    isLoadingShares: boolean;
    setLoadUserSharesPromise: (promise: Promise<{ defaultShareId?: string; shares: Share[] }>) => void;
    clearLoadUserSharesPromise: () => void;
    setDefaultSharePromise: (promise: Promise<ShareWithKey>) => void;
    clearDefaultSharePromise: () => void;
    setDefaultPhotosSharePromise: (promise: Promise<ShareWithKey | undefined>) => void;
    clearDefaultPhotosSharePromise: () => void;
    setIsLoadingShares: (isLoading: boolean) => void;
}
