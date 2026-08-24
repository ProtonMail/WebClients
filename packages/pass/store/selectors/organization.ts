import type { Organization } from '@proton/shared/lib/interfaces';

import { isB2BAdmin } from '../../lib/organization/helpers';
import { getPassPlan } from '../../lib/user/user.plan';
import type { MaybeNull, OrganizationUpdatePasswordPolicyInput, OrganizationVaultCreateMode } from '../../types';
import type { OrganizationSettings } from '../../types/data/organization';
import type { OrganizationState } from '../reducers/organization';
import type { State } from '../types';

export const selectOrganizationState = ({ organization }: State): MaybeNull<OrganizationState> => organization;

export const selectOrganization = ({ organization }: State): MaybeNull<Organization> => organization?.organization ?? null;

export const selectOrganizationSettings = ({ organization }: State): MaybeNull<OrganizationSettings> => organization?.settings ?? null;

export const selectCanUpdateOrganization = ({ organization }: State): boolean => organization?.canUpdate ?? false;

export const selectOrganizationPasswordGeneratorPolicy = ({ organization }: State): MaybeNull<OrganizationUpdatePasswordPolicyInput> =>
    organization?.settings?.PasswordPolicy ?? null;

export const selectOrganizationVaultCreationPolicy = ({
    organization,
    user: { user, plan },
}: State): MaybeNull<OrganizationVaultCreateMode> =>
    user !== null && !isB2BAdmin(user, getPassPlan(plan)) ? (organization?.settings?.VaultCreateMode ?? null) : null;
