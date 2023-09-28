import { type MaybeNull } from '../utils';
import type { ShareRole, ShareType } from './shares';

export type PendingInvite = {
    inviteId: string;
    invitedEmail: string;
    inviterEmail: string;
    targetType: ShareType;
    targetId: string;
    remindersSent: number;
    createTime: number;
    modifyTime: number;
};

export type ShareMember = {
    shareId: string;
    name: string;
    email: string;
    owner: boolean;
    targetType: ShareType;
    targetId: string;
    shareRoleId: ShareRole;
    expireTime?: MaybeNull<number>;
    createTime: number;
};
