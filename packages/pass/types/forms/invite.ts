import type { ListFieldValue } from '@proton/pass/components/Form/Field/ListField';
import type { ShareRole, ShareType, UniqueItem, VaultFormValues } from '@proton/pass/types';

export type VaultInviteFormStep = 'members' | 'vault' | 'permissions' | 'review';
export type ItemInviteFormStep = 'members' | 'permissions' | 'review';

export type InviteFormMemberValue = { email: string; role: ShareRole };

export type InviteFormValues =
    | ({ shareType: ShareType.Vault } & VaultInviteFormValues)
    | ({ shareType: ShareType.Item } & ItemInviteFormValues);

export type VaultInviteFormValues<T extends boolean = boolean> = Extract<
    {
        members: ListFieldValue<InviteFormMemberValue>[];
        step: VaultInviteFormStep;
        shareType: ShareType.Vault;
    } & VaultFormValues &
        ({ withVaultCreation: true; item?: UniqueItem } | { withVaultCreation: false; shareId: string }),
    { withVaultCreation: T }
>;

export type ItemInviteFormValues = {
    members: ListFieldValue<InviteFormMemberValue>[];
    step: ItemInviteFormStep;
    shareId: string;
    itemId: string;
    shareType: ShareType.Item;
};
