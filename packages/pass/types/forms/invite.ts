import type { ShareRole } from '@proton/pass/types';

export type InviteFormStep = 'email' | 'permissions';
export type InviteFormValues = { email: string; role: ShareRole; step: InviteFormStep };
