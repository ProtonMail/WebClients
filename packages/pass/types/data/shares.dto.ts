import type { NewUserPendingInvite, PendingInvite, ShareMember } from './invites';
import type { ShareRole } from './shares';

export type ShareRemoveMemberAccessIntent = { shareId: string; userShareId: string };
export type ShareEditMemberAccessIntent = { shareId: string; userShareId: string; shareRoleId: ShareRole };

export type ShareAccessOptions = {
    shareId: string;
    itemId?: string;
    invites?: PendingInvite[];
    newUserInvites?: NewUserPendingInvite[];
    members: ShareMember[];
};
