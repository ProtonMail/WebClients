import type { ShareRole } from './shares';

export type InviteCreateIntent = { shareId: string; email: string; role: ShareRole };
export type InviteResendIntent = { shareId: string; inviteId: string };
