import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { addDomain } from '@proton/shared/lib/api/domains';
import { createGroup as createGroupCall, editGroup as editGroupCall } from '@proton/shared/lib/api/groups';
import type {
    Api,
    Domain,
    Group,
    GroupFlags,
    GroupPermissions,
    KeyTransparencyVerify,
} from '@proton/shared/lib/interfaces';
import { createGroupAddressKey } from '@proton/shared/lib/keys/groupKeys';

import { domainsThunk } from '../domains';
import { organizationKeyThunk } from '../organizationKey';
import type { GroupsState } from './index';

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

const saveGroup =
    ({ editMode = false }: { editMode: boolean }) =>
    ({
        group: groupPayload,
        keyTransparencyVerify,
        api,
    }: {
        group: SaveGroupPayload;
        keyTransparencyVerify: KeyTransparencyVerify;
        api: Api;
    }): ThunkAction<Promise<Group>, GroupsState, ProtonThunkArguments, UnknownAction> => {
        return async (dispatch) => {
            const [domains] = await Promise.all([dispatch(domainsThunk())]);

            if (!domains?.some((domain) => domain.DomainName === groupPayload.domain)) {
                await addSubdomain(api, groupPayload.domain);
            }

            const groupData = {
                Name: groupPayload.name,
                Email: groupPayload.email,
                Description: groupPayload.description,
                Permissions: groupPayload.permissions,
                Flags: groupPayload.flags,
            } as const;

            let group;

            if (editMode) {
                if (groupPayload.id === undefined) {
                    throw new Error('Missing group ID');
                }
                group = (await api(editGroupCall(groupPayload.id, groupData))).Group;
            } else {
                group = (await api(createGroupCall(groupData))).Group;
            }

            const cachedOrganizationKey = await dispatch(organizationKeyThunk());
            const organizationKey = cachedOrganizationKey?.privateKey;

            if (!organizationKey) {
                throw new Error('Missing organization private key');
            }

            if (!editMode) {
                group.Address.Keys = await createGroupAddressKey({
                    api,
                    organizationKey: cachedOrganizationKey,
                    address: group.Address,
                    keyTransparencyVerify,
                });
            }

            return group;
        };
    };

export const createGroup = saveGroup({ editMode: false });
export const editGroup = saveGroup({ editMode: true });
