import type { ShareRole } from './shares';

export type ShareRemoveMemberAccessIntent = { shareId: string; userShareId: string };
export type ShareEditMemberAccessIntent = { shareId: string; userShareId: string; shareRoleId: ShareRole };
