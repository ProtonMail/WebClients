import { isB2BAdmin } from '@proton/pass/lib/organization/helpers';
import type { FiltersState } from '@proton/pass/store/reducers';
import { type MaybeNull } from '@proton/pass/types';
import type { EncryptedPassCache } from '@proton/pass/types/worker/cache';
import { type XorObfuscation, obfuscate } from '@proton/pass/utils/obfuscate/xor';
import { objectFilter } from '@proton/pass/utils/object/filter';
import { objectMap } from '@proton/pass/utils/object/map';
import { semver } from '@proton/pass/utils/string/semver';
import type { Organization } from '@proton/shared/lib/interfaces';

import { unwrapOptimisticState } from './optimistic/utils/transformers';
import { INITIAL_ORGANIZATION_SETTINGS } from './reducers/organization';
import { INITIAL_HIGHSECURITY_SETTINGS } from './reducers/user';
import { selectLoginItems, selectPassPlan, selectUser } from './selectors';
import type { State } from './types';

/** Ensures cache compatibility during rollbacks by ignoring cached state
 * if it was created by a newer app version than the one currently running.
 * This prevents potential data structure mismatches or incompatibilities
 * in the event of an application rollback. */
export const cacheGuard = (
    encryptedCache: Partial<EncryptedPassCache>,
    appVersion: string
): Partial<EncryptedPassCache> => {
    const { version } = encryptedCache;
    if (version && semver(version) <= semver(appVersion)) return encryptedCache;
    return {};
};

export const migrate = (state: State, versions: { from?: string; to: string }) => {
    const user = selectUser(state);
    const plan = selectPassPlan(state);

    /** Sanity migration :
     * Sanitize the item state to ensure we have no invalid item
     * data - FIXME: remove when pin-pointing the faulty partial
     * item update causing this edge-case error */
    state.items.byShareId = {
        ...state.items.byShareId,
        ...objectMap(unwrapOptimisticState(state.items.byShareId), (_, items) =>
            objectFilter(items, (_, item) => item && ['itemId', 'shareId', 'data'].every((key) => key in item))
        ),
    };

    /** Migration for share visibility flag */
    for (const shareId in state.shares) {
        const share = state.shares[shareId];
        share.flags = 'flags' in share ? share.flags : 0;
    }

    /** v1.13.0 migration */
    if ('organization' in state.user) {
        const organization = state.user.organization as MaybeNull<Organization>;
        delete state.user.organization;

        if (!state.organization) {
            state.organization = organization
                ? {
                      organization,
                      canUpdate: user ? isB2BAdmin(user, plan) : false,
                      settings: INITIAL_ORGANIZATION_SETTINGS,
                  }
                : null;
        }
    }

    /** v1.17.2 migration */
    if (state.user.userSettings && !state.user.userSettings.HighSecurity) {
        state.user.userSettings.HighSecurity = INITIAL_HIGHSECURITY_SETTINGS;
    }

    /** v1.20.0 migration */
    selectLoginItems(state).forEach(({ data: { content: item } }) => {
        if ('username' in item) {
            item.itemEmail = item.username as XorObfuscation;
            item.itemUsername = obfuscate('');
            delete item.username;
        }
    });

    /** v1.23.0 migration */
    if (!state.user.userData) {
        state.user.userData = {
            defaultShareId: null,
            aliasSyncEnabled: false,
            pendingAliasToSync: 0,
        };
    }

    /** v1.24.0 migration */
    if (!state.user.devices) state.user.devices = [];

    /** v1.25.1 migration */
    if ('popup' in state) {
        const filters = state.popup as FiltersState;
        delete state.popup;
        state.filters = filters;
    }

    /** v1.26.0 migration */
    if (state.alias.aliasDetails) {
        const legacy = Object.values(state.alias.aliasDetails).some(Array.isArray);
        if (legacy) state.alias.aliasDetails = {};
    }

    /** Clear request cache on update */
    if (!versions.from || semver(versions.from) < semver(versions.to)) state.request = {};

    /** v1.28.0 migration */
    for (const shareId in state.shares) {
        const share = state.shares[shareId];
        if ('invites' in share) delete share.invites;
        if ('newUserInvites' in share) delete share.newUserInvites;
        if ('members' in share) delete share.members;
    }

    return state;
};
