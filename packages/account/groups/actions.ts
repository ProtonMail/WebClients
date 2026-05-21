import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { addDomain } from '@proton/shared/lib/api/domains';
import {
    createGroup as createGroupCall,
    deleteGroup as deleteGroupCall,
    editGroup as editGroupCall,
} from '@proton/shared/lib/api/groups';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { Api, Domain, EnhancedGroup, Group, GroupFlags, GroupPermissions } from '@proton/shared/lib/interfaces';
import { createGroupAddressKey } from '@proton/shared/lib/keys/groupKeys';

import { domainsThunk } from '../domains';
import type { KtState } from '../kt';
import { getKTActivation } from '../kt/actions';
import { organizationKeyThunk } from '../organizationKey';
import { userThunk } from '../user';
import { type GroupsState, addGroup, removeGroup, updateGroup } from './index';

interface SaveGroupPayload {
    id: string | undefined;
    name: string;
    email: string;
    domain: string;
    description: string;
    permissions: GroupPermissions;
    flags: GroupFlags;
}

export const addSubdomain = async (api: Api, domainName: string) => {
    const { Domain } = await api<{ Domain: Domain }>(addDomain({ Name: `${domainName}.pm.me` }));
    return Domain;
};

const GROUPS_DOMAIN_REGEX = /^groups\.(proton\.me|protonmail\.dev|.+\.proton\.black)$/;

const saveGroup =
    ({ editMode = false }: { editMode: boolean }) =>
    ({
        group: groupPayload,
        api,
    }: {
        group: SaveGroupPayload;
        api: Api;
    }): ThunkAction<Promise<Group>, GroupsState & KtState, ProtonThunkArguments, UnknownAction> => {
        return async (dispatch, _, extra) => {
            const [domains, user] = await Promise.all([dispatch(domainsThunk()), dispatch(userThunk())]);

            const isGroupDomain = GROUPS_DOMAIN_REGEX.test(groupPayload.domain);
            const isDomainInDomains = domains?.some((domain) => domain.DomainName === groupPayload.domain);

            const isAdmin = user.Role === USER_ROLES.ADMIN_ROLE;
            if (isAdmin && !isGroupDomain && !isDomainInDomains) {
                await addSubdomain(api, groupPayload.domain);
            }

            const groupData = {
                Name: groupPayload.name,
                Email: groupPayload.email,
                Description: groupPayload.description,
                Permissions: groupPayload.permissions,
                Flags: groupPayload.flags,
            } as const;

            let group: Group;

            if (editMode) {
                if (groupPayload.id === undefined) {
                    throw new Error('Missing group ID');
                }
                group = (await api<{ Group: Group }>(editGroupCall(groupPayload.id, groupData))).Group;
            } else {
                group = (await api<{ Group: Group }>(createGroupCall(groupData))).Group;
            }

            if (isAdmin && !editMode) {
                const cachedOrganizationKey = await dispatch(organizationKeyThunk());
                const organizationKey = cachedOrganizationKey?.privateKey;

                if (!organizationKey) {
                    throw new Error('Missing organization private key');
                }

                // TODO: Check if group keys are not commited?
                const { keyTransparencyVerify /*, keyTransparencyCommit*/ } = createKTVerifier({
                    ktActivation: dispatch(getKTActivation()),
                    api,
                    config: extra.config,
                });

                group.Address.Keys = await createGroupAddressKey({
                    api,
                    organizationKey: cachedOrganizationKey,
                    address: group.Address,
                    keyTransparencyVerify,
                });
                group.Address.HasKeys = 1;
            }

            if (editMode) {
                dispatch(updateGroup(group));
            } else {
                dispatch(addGroup(group));
            }

            return group;
        };
    };

export const createGroup = saveGroup({ editMode: false });
export const editGroup = saveGroup({ editMode: true });

export const deleteGroup = (
    group: EnhancedGroup
): ThunkAction<Promise<void>, GroupsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        await extra.api(deleteGroupCall(group.ID));
        dispatch(removeGroup(group.ID));
    };
};
