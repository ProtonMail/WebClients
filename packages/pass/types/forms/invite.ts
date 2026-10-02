import type { SelectedItem, SelectedShare, ShareRole } from '..';
import type { ListFieldValue } from '../../components/Form/Field/ListField';
import type { AccessTarget } from '../../lib/access/types';

export type InviteFormStep = 'members' | 'permissions' | 'review';
type InviteFormMemberValue = { email: string; role: ShareRole; isGroup: boolean };
export type InviteFormMemberItem = ListFieldValue<InviteFormMemberValue>;

type InviteFormValuesBase<T extends AccessTarget = AccessTarget, V = {}> = {
    target: T;
    step: InviteFormStep;
    members: InviteFormMemberItem[];
} & V;

export type ItemInviteFormValues = InviteFormValuesBase<AccessTarget.Item, SelectedItem>;
export type VaultInviteFormValues = InviteFormValuesBase<AccessTarget.Vault, SelectedShare>;
export type InviteFormValues = VaultInviteFormValues | ItemInviteFormValues;
