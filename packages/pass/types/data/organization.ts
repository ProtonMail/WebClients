import type { OrganizationSettingsGetResponse, OrganizationUpdatePasswordPolicyInput } from '../api/pass';
import type { MaybeNull } from '../utils';

export type OrganizationSettings = Omit<OrganizationSettingsGetResponse, 'PasswordPolicy'> & {
    PasswordPolicy: MaybeNull<OrganizationUpdatePasswordPolicyInput>;
};
