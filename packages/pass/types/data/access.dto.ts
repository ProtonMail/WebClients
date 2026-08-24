import type { AccessDTO, AccessItem, AccessKeys } from '../../lib/access/types';
import type { ShareRole } from './shares';

export type ShareRemoveMemberAccessIntent = AccessDTO & { userShareId: string };
export type ShareEditMemberAccessIntent = AccessDTO & { userShareId: string; shareRoleId: ShareRole };
export type ShareAccessResult = AccessItem & AccessKeys;
