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
    name: string;
    email: string;
    owner: boolean;
    targetType: ShareType;
    targetId: string;
    permission: number;
    shareRoleId: ShareRole;
    expireTime: number;
    createTime: number;
};
