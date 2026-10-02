import type { AccessDTO } from '../../lib/access/types';
import type { ShareRole } from './shares';

export type ShareRemoveMemberAccessIntent = AccessDTO & { userShareId: string };
export type ShareEditMemberAccessIntent = AccessDTO & { userShareId: string; shareRoleId: ShareRole };
