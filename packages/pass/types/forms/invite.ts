import type { ListFieldValue } from '@proton/pass/components/Form/Field/ListField';
import type { AccessTarget } from '@proton/pass/lib/access/types';
import type { SelectedItem, SelectedShare, ShareRole } from '@proton/pass/types';

export type InviteFormStep = 'members' | 'permissions' | 'review';
export type InviteFormMemberValue = { email: string; role: ShareRole };
export type InviteFormMemberItem = ListFieldValue<InviteFormMemberValue>;

export type InviteFormValuesBase<T extends AccessTarget = AccessTarget, V = {}> = {
    target: T;
    step: InviteFormStep;
    members: InviteFormMemberItem[];
} & V;

export type ItemInviteFormValues = InviteFormValuesBase<AccessTarget.Item, SelectedItem>;
export type VaultInviteFormValues = InviteFormValuesBase<AccessTarget.Vault, SelectedShare>;
export type InviteFormValues = VaultInviteFormValues | ItemInviteFormValues;
