import type { Organization } from '@proton/shared/lib/interfaces/Organization';

import { isB2BAdmin } from '../../lib/organization/helpers';
import { getPassPlan } from '../../lib/user/user.plan';
import {
    OrganizationAliasCreateMode,
    OrganizationCanStorePasskeyMode,
    OrganizationCanStoreTotpMode,
    OrganizationItemShareMode,
    OrganizationPublicLinkMode,
    type OrganizationUpdatePasswordPolicyInput,
    type OrganizationVaultCreateMode,
} from '../../types/api/pass';
import type { OrganizationSettings } from '../../types/data/organization';
import type { MaybeNull } from '../../types/utils';
import type { OrganizationState } from '../reducers/organization';
import type { State } from '../types';

export const selectOrganizationState = ({ organization }: State): MaybeNull<OrganizationState> => organization;

export const selectOrganization = ({ organization }: State): MaybeNull<Organization> => organization?.organization ?? null;

export const selectOrganizationSettings = ({ organization }: State): MaybeNull<OrganizationSettings> => organization?.settings ?? null;

export const selectOrganizationPasswordGeneratorPolicy = ({ organization }: State): MaybeNull<OrganizationUpdatePasswordPolicyInput> =>
    organization?.settings?.PasswordPolicy ?? null;

export const selectOrganizationVaultCreationPolicy = ({
    organization,
    user: { user, plan },
}: State): MaybeNull<OrganizationVaultCreateMode> =>
    user !== null && !isB2BAdmin(user, getPassPlan(plan)) ? (organization?.settings?.VaultCreateMode ?? null) : null;

export const selectOrgAliasCreationDisabled = (state: State): boolean =>
    selectOrganizationSettings(state)?.AliasCreateMode === OrganizationAliasCreateMode.NOBODY;

export const selectOrgItemSharingDisabled = (state: State): boolean =>
    selectOrganizationSettings(state)?.ItemShareMode === OrganizationItemShareMode.DISABLED;

export const selectOrgPublicLinkDisabled = (state: State): boolean =>
    selectOrganizationSettings(state)?.PublicLinkMode === OrganizationPublicLinkMode.DISABLED;

export const selectOrgTOTPDisabled = (state: State): boolean =>
    selectOrganizationSettings(state)?.CanStoreTotp === OrganizationCanStoreTotpMode.DISABLED;

export const selectOrgPasskeyDisabled = (state: State): boolean =>
    selectOrganizationSettings(state)?.CanStorePasskey === OrganizationCanStorePasskeyMode.DISABLED;
