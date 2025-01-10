import type { ListFieldValue } from '@proton/pass/components/Form/Field/ListField';
import type { SelectedItem, SelectedShare, ShareRole, ShareType } from '@proton/pass/types';

export type InviteFormStep = 'members' | 'permissions' | 'review';

export type InviteFormMemberValue = { email: string; role: ShareRole };

export type InviteFormValuesBase<Type extends ShareType = ShareType, Values = {}> = {
    shareType: Type;
    step: InviteFormStep;
    members: ListFieldValue<InviteFormMemberValue>[];
} & Values;

export type ItemInviteFormValues = InviteFormValuesBase<ShareType.Item, SelectedItem>;
export type VaultInviteFormValues = InviteFormValuesBase<ShareType.Vault, SelectedShare>;
export type InviteFormValues = VaultInviteFormValues | ItemInviteFormValues;
