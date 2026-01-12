import type {
    OrganizationSettingsGetResponse,
    OrganizationUpdatePasswordPolicyInput,
} from '@proton/pass/types/api/pass';
import type { MaybeNull } from '@proton/pass/types/utils';

export type OrganizationSettings = Omit<OrganizationSettingsGetResponse, 'PasswordPolicy'> & {
    PasswordPolicy: MaybeNull<OrganizationUpdatePasswordPolicyInput>;
};
