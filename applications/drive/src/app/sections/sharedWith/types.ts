import type { MemberRole, NodeType } from '@proton/drive';

export enum ItemType {
    BOOKMARK = 'bookmark',
    DIRECT_SHARE = 'directShare',
    INVITATION = 'invitation',
}

type BaseSharedWithMeItem = {
    name: string;
    type: NodeType;
    size: number | undefined;
    mediaType: string | undefined;
    thumbnailId: string | undefined;
};

export type BookmarkItem = BaseSharedWithMeItem & {
    itemType: ItemType.BOOKMARK;
    bookmark: {
        uid: string;
        url: string;
        creationTime: Date;
    };
};

export type DirectShareItem = BaseSharedWithMeItem & {
    nodeUid: string;
    shareId: string;
    itemType: ItemType.DIRECT_SHARE;
    haveSignatureIssues: boolean | undefined;
    role: MemberRole;
    directShare: {
        sharedOn: Date;
        sharedBy: string;
    };
};

export type InvitationItem = BaseSharedWithMeItem & {
    nodeUid: string;
    shareId: string;
    itemType: ItemType.INVITATION;
    invitation: {
        uid: string;
        sharedBy: string;
    };
};

export type SharedWithMeItem = BookmarkItem | DirectShareItem | InvitationItem;
