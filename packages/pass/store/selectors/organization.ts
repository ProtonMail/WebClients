import type { OrganizationState } from '@proton/pass/store/reducers/organization';
import type { State } from '@proton/pass/store/types';
import type { MaybeNull } from '@proton/pass/types';
import type { OrganizationSettings } from '@proton/pass/types/data/organization';
import type { Organization } from '@proton/shared/lib/interfaces';

export const selectOrganizationState = ({ organization }: State): MaybeNull<OrganizationState> => organization;

export const selectOrganization = ({ organization }: State): MaybeNull<Organization> =>
    organization?.organization ?? null;

export const selectOrganizationSettings = ({ organization }: State): MaybeNull<OrganizationSettings> =>
    organization?.settings ?? null;

export const selectCanUpdateOrganization = ({ organization }: State): boolean => organization?.canUpdate ?? false;
