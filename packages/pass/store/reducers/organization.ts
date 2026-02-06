import type { Reducer } from 'redux';

import { getUserAccessSuccess, userEvent } from '@proton/pass/store/actions';
import { getOrganizationGroups, getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import {
    type MaybeNull,
    OrganizationExportMode,
    OrganizationItemShareMode,
    OrganizationPublicLinkMode,
    OrganizationShareMode,
    OrganizationVaultCreateMode,
    PlanType,
} from '@proton/pass/types';
import type { OrganizationSettings } from '@proton/pass/types/data/organization';
import type { Group, Organization } from '@proton/shared/lib/interfaces';

export const INITIAL_ORGANIZATION_SETTINGS: OrganizationSettings = {
    ExportMode: OrganizationExportMode.UNRESTRICTED,
    ShareMode: OrganizationShareMode.UNRESTRICTED,
    ForceLockSeconds: 0,
    PasswordPolicy: null,
    ShareAcceptMode: OrganizationShareMode.UNRESTRICTED,
    VaultCreateMode: OrganizationVaultCreateMode.ALLOWED,
    ItemShareMode: OrganizationItemShareMode.DISABLED,
    PublicLinkMode: OrganizationPublicLinkMode.DISABLED,
};

export type OrganizationState = {
    canUpdate: boolean;
    organization: Organization;
    settings: OrganizationSettings;
    groups: Group[];
};

const organizationReducer: Reducer<MaybeNull<OrganizationState>> = (state = null, action) => {
    /* Remove all organization state if the user plan changes */
    if (getUserAccessSuccess.match(action)) return action.payload.plan.Type !== PlanType.BUSINESS ? null : state;

    if (state !== null) {
        /* Actions applied to the organization state should only be processed
         * if we actually have an organization state in the first place. */
        if (userEvent.match(action) && action.payload.Organization) {
            return { ...state, organization: action.payload.Organization };
        }

        if (getOrganizationSettings.success.match(action)) {
            return { ...state, settings: action.payload.Settings, canUpdate: action.payload.CanUpdate };
        }

        if (getOrganizationGroups.success.match(action)) {
            return { ...state, groups: action.payload.Groups };
        }
    }

    return state;
};

export default organizationReducer;
