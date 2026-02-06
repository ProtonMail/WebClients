import { isB2BAdmin } from '@proton/pass/lib/organization/helpers';
import { getPassPlan } from '@proton/pass/lib/user/user.plan';
import type { OrganizationState } from '@proton/pass/store/reducers/organization';
import type { State } from '@proton/pass/store/types';
import type { MaybeNull, OrganizationUpdatePasswordPolicyInput, OrganizationVaultCreateMode } from '@proton/pass/types';
import type { OrganizationSettings } from '@proton/pass/types/data/organization';
import type { Group, Organization } from '@proton/shared/lib/interfaces';

export const selectOrganizationState = ({ organization }: State): MaybeNull<OrganizationState> => organization;

export const selectOrganization = ({ organization }: State): MaybeNull<Organization> => organization?.organization ?? null;

export const selectOrganizationSettings = ({ organization }: State): MaybeNull<OrganizationSettings> => organization?.settings ?? null;

export const selectOrganizationGroups = ({ organization }: State): MaybeNull<Group[]> => organization?.groups ?? null;

export const selectCanUpdateOrganization = ({ organization }: State): boolean => organization?.canUpdate ?? false;

export const selectOrganizationPasswordGeneratorPolicy = ({ organization }: State): MaybeNull<OrganizationUpdatePasswordPolicyInput> =>
    organization?.settings?.PasswordPolicy ?? null;

export const selectOrganizationVaultCreationPolicy = ({
    organization,
    user: { user, plan },
}: State): MaybeNull<OrganizationVaultCreateMode> =>
    user !== null && !isB2BAdmin(user, getPassPlan(plan)) ? (organization?.settings?.VaultCreateMode ?? null) : null;
