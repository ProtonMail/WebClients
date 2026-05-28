import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { EnhancedGroup, Group } from '@proton/shared/lib/interfaces';
import { createGroupAddressKey } from '@proton/shared/lib/keys/groupKeys';
import isTruthy from '@proton/utils/isTruthy';

import type { AddressesState } from '../addresses';
import { type GroupsState, groupThunk, updateGroups } from '../groups';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import type { UserKeysState } from '../userKeys';
import { getIsSystemGroup } from './groupFlags';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState & KtState & GroupsState;

export const getGroupHasKeys = (group: Group) => {
    return group.Address.Keys.length || group.Address.HasKeys;
};

export const groupsToGenerateFilter = (group: Group) => {
    // If the group already has keys, ignore.
    if (getGroupHasKeys(group)) {
        return false;
    }
    // Ignore if it's not a system group, to avoid introducing potential regressions with other types of groups.
    return getIsSystemGroup(group);
};

/**
 * Ensures all groups have keys (for example system groups).
 */
export const generateGroupKeysIfNeeded = (): ThunkAction<
    Promise<EnhancedGroup[]>,
    RequiredState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const [groups, organizationKey] = await Promise.all([dispatch(groupThunk()), dispatch(organizationKeyThunk())]);

        const groupsToGenerate = groups.filter(groupsToGenerateFilter);
        if (!groupsToGenerate.length) {
            return [];
        }
        if (!organizationKey.privateKey) {
            throw new Error('Organization key not decrypted');
        }
        const api = getSilentApi(extra.api);

        // TODO: Check if group keys are not commited?
        const { keyTransparencyVerify /*, keyTransparencyCommit*/ } = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api,
            config: extra.config,
        });

        const updatedGroups = (
            await Promise.all(
                groupsToGenerate.map(async (group): Promise<EnhancedGroup | null> => {
                    try {
                        return {
                            ...group,
                            Address: {
                                ...group.Address,
                                Keys: await createGroupAddressKey({
                                    api,
                                    organizationKey,
                                    address: group.Address,
                                    keyTransparencyVerify,
                                }),
                                HasKeys: 1,
                            },
                        };
                    } catch {
                        // ignored
                        return null;
                    }
                })
            )
        ).filter(isTruthy);

        if (updatedGroups.length) {
            dispatch(updateGroups(updatedGroups));
        }

        return updatedGroups;
    };
};
