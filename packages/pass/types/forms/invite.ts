import type { ListFieldValue } from '@proton/pass/components/Form/Field/ListField';
import type { ShareRole, UniqueItem, VaultFormValues } from '@proton/pass/types';

export type InviteFormStep = 'members' | 'vault' | 'permissions' | 'review';
export type InviteFormMemberValue = { email: string; role: ShareRole };

export type InviteFormValues<T extends boolean = boolean> = Extract<
    {
        members: ListFieldValue<InviteFormMemberValue>[];
        step: InviteFormStep;
        orgEmails?: string[];
    } & VaultFormValues &
        ({ withVaultCreation: true; item?: UniqueItem } | { withVaultCreation: false; shareId: string }),
    { withVaultCreation: T }
>;
