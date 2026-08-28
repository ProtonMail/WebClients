import type { OrganizationExtended, OrganizationSettings } from '@proton/shared/lib/interfaces';

import type { MailStateSlice } from './buildMailState';

/**
 * Temporary home for the test state factories of slices owned by shared packages.
 * They will be living alongide their slices in the future.
 */

const DEFAULT_ORGANIZATION_SETTINGS: Partial<OrganizationSettings> = {
    MailCategoryViewEnabled: true,
};

/** Matches `ValueType.complete` from `@proton/account/organization`. */
const ORGANIZATION_LOADED_META = {
    type: 1,
    fetchedAt: Date.now(),
    fetchedEphemeral: true,
} as const;

/** Matches the organization slice initial state in `@proton/account/organization`. */
const ORGANIZATION_UNLOADED_META = {
    type: 0,
    fetchedAt: 0,
    fetchedEphemeral: undefined,
} as const;

export const organizationState = (settings?: Partial<OrganizationSettings>): MailStateSlice => ({
    organization: {
        value: {
            Settings: { ...DEFAULT_ORGANIZATION_SETTINGS, ...settings },
        } as OrganizationExtended,
        error: undefined,
        meta: ORGANIZATION_LOADED_META,
    },
});

/**
 * The organization has not been fetched yet.
 */
export const unloadedOrganizationState = (): MailStateSlice => ({
    organization: {
        value: undefined,
        error: undefined,
        meta: ORGANIZATION_UNLOADED_META,
    },
});
