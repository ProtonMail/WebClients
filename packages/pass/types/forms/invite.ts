import type { ShareRole, VaultFormValues } from '@proton/pass/types';

export type InviteFormStep = 'email' | 'vault' | 'permissions';

export type InviteFormValues<T extends boolean = boolean> = Extract<
    { email: string; role: ShareRole; step: InviteFormStep } & (
        | ({ withVaultCreation: true } & VaultFormValues)
        | { withVaultCreation: false; shareId: string }
    ),
    { withVaultCreation: T }
>;
