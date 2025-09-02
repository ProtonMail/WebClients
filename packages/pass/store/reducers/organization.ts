import type { Reducer } from 'redux';

import { getUserAccessSuccess, userEvent } from '@proton/pass/store/actions';
import { getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import { BitField, type MaybeNull, PlanType } from '@proton/pass/types';
import type { OrganizationSettings } from '@proton/pass/types/data/organization';
import type { Organization } from '@proton/shared/lib/interfaces';

export const INITIAL_ORGANIZATION_SETTINGS: OrganizationSettings = {
    ExportMode: BitField.DISABLED,
    ShareMode: BitField.DISABLED,
    ForceLockSeconds: BitField.DISABLED,
    PasswordPolicy: null,
    ShareAcceptMode: BitField.DISABLED,
    VaultCreateMode: BitField.DISABLED,
    ItemShareMode: BitField.DISABLED,
    PublicLinkMode: BitField.DISABLED,
};

export type OrganizationState = {
    canUpdate: boolean;
    organization: Organization;
    settings: OrganizationSettings;
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
            const { Settings, CanUpdate } = action.payload;
            return { ...state, settings: Settings, canUpdate: CanUpdate };
        }
    }

    return state;
};

export default organizationReducer;
