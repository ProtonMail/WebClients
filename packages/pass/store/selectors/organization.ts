import { isB2BAdmin } from '@proton/pass/lib/organization/helpers';
import { getPassPlan } from '@proton/pass/lib/user/user.plan';
import type { OrganizationState } from '@proton/pass/store/reducers/organization';
import type { State } from '@proton/pass/store/types';
import { BitField, type MaybeNull, type OrganizationUpdatePasswordPolicyRequest } from '@proton/pass/types';
import type { OrganizationSettings } from '@proton/pass/types/data/organization';
import type { Organization } from '@proton/shared/lib/interfaces';

export const selectOrganizationState = ({ organization }: State): MaybeNull<OrganizationState> => organization;

export const selectOrganization = ({ organization }: State): MaybeNull<Organization> => organization?.organization ?? null;

export const selectOrganizationSettings = ({ organization }: State): MaybeNull<OrganizationSettings> => organization?.settings ?? null;

export const selectCanUpdateOrganization = ({ organization }: State): boolean => organization?.canUpdate ?? false;

export const selectOrganizationPasswordGeneratorPolicy = ({ organization }: State): MaybeNull<OrganizationUpdatePasswordPolicyRequest> =>
    organization?.settings?.PasswordPolicy ?? null;

export const selectOrganizationVaultCreationDisabled = ({ organization, user: { user, plan } }: State): boolean =>
    user !== null && !isB2BAdmin(user, getPassPlan(plan)) && organization?.settings?.VaultCreateMode === BitField.ACTIVE;
