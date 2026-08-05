import type { OrganizationExtended, OrganizationSettings } from '@proton/shared/lib/interfaces';
import { getOrganizationState } from '@proton/testing/lib/initialReduxState';

import type { MailStateSlice } from './buildMailState.testing';

/**
 * Temporary home for the test state factories of slices owned by shared packages.
 * They will be living alongide their slices in the future.
 */

const DEFAULT_ORGANIZATION_SETTINGS: Partial<OrganizationSettings> = {
    MailCategoryViewEnabled: true,
};

export const organizationState = (settings?: Partial<OrganizationSettings>): MailStateSlice => ({
    organization: getOrganizationState({
        Settings: { ...DEFAULT_ORGANIZATION_SETTINGS, ...settings },
    } as OrganizationExtended),
});

/**
 * The organization has not been fetched yet.
 */
export const unloadedOrganizationState = (): MailStateSlice => {
    const state = getOrganizationState();

    return {
        organization: {
            ...state,
            value: undefined,
            // ValueType.dummy, which the organization slice does not export.
            meta: { ...state.meta, type: 0, fetchedAt: 0, fetchedEphemeral: undefined },
        },
    };
};
