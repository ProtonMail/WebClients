import type { Reducer } from 'redux';

import type { Organization } from '@proton/shared/lib/interfaces';

import { isPassB2BPlan } from '../../lib/b2b/b2b.utils';
import {
    type MaybeNull,
    OrganizationAliasCreateMode,
    OrganizationExportMode,
    OrganizationItemShareMode,
    OrganizationPublicLinkMode,
    OrganizationShareMode,
    OrganizationVaultCreateMode,
} from '../../types';
import type { OrganizationSettings } from '../../types/data/organization';
import { or } from '../../utils/fp/predicates';
import { coreEvent, getUserAccessSuccess, matchSyncAction } from '../actions';
import { getOrganizationSettings, setOrganization, setOrganizationSettings } from '../actions/creators/organization';

export const INITIAL_ORGANIZATION_SETTINGS: OrganizationSettings = {
    ExportMode: OrganizationExportMode.UNRESTRICTED,
    ShareMode: OrganizationShareMode.UNRESTRICTED,
    ForceLockSeconds: 0,
    PasswordPolicy: null,
    ShareAcceptMode: OrganizationShareMode.UNRESTRICTED,
    VaultCreateMode: OrganizationVaultCreateMode.ALLOWED,
    ItemShareMode: OrganizationItemShareMode.DISABLED,
    PublicLinkMode: OrganizationPublicLinkMode.DISABLED,
    AliasCreateMode: OrganizationAliasCreateMode.ALLOWEDFORALLMEMBERS,
};

export type OrganizationState = {
    canUpdate: boolean;
    organization: Organization;
    settings: OrganizationSettings;
};

const organizationReducer: Reducer<MaybeNull<OrganizationState>> = (state = null, action) => {
    /* Remove all organization state if the user plan changes */
    if (matchSyncAction(action) && action.payload?.v === 2) return action.payload.organization;
    if (setOrganization.match(action)) return action.payload;

    /* Remove all organization state if the user plan is no longer B2B.
     * Pass Essentials is currently considered Plus and not Business */
    if (getUserAccessSuccess.match(action)) return isPassB2BPlan(action.payload.plan) ? state : null;

    if (state !== null) {
        /* Actions applied to the organization state should only be processed
         * if we actually have an organization state in the first place. */
        if (coreEvent.match(action) && action.payload.Organization) {
            return { ...state, organization: action.payload.Organization };
        }

        if (or(setOrganizationSettings.match, getOrganizationSettings.success.match)(action)) {
            return { ...state, settings: action.payload.Settings, canUpdate: action.payload.CanUpdate };
        }
    }

    return state;
};

export default organizationReducer;
