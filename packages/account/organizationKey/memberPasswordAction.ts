import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { updatePrivateKeyRoute } from '@proton/shared/lib/api/keys';
import { disable2FA } from '@proton/shared/lib/api/settings';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import type { Api, Member } from '@proton/shared/lib/interfaces';
import { generateKeySaltAndPassphrase, getIsPasswordless, getMemberKeys } from '@proton/shared/lib/keys';
import { getUpdateKeysPayload } from '@proton/shared/lib/keys/changePassword';
import { getOrganizationKeyInfo, validateOrganizationKey } from '@proton/shared/lib/organization/helper';
import { srpVerify } from '@proton/shared/lib/srp';

import { addressesThunk } from '../addresses';
import { type MembersState, getMemberAddresses, upsertMember } from '../members';
import { getMember } from '../members/actions';
import { type OrganizationState, organizationThunk } from '../organization';
import { type OrganizationKeyState, organizationKeyThunk } from './index';

export const changeMemberPassword = ({
    member,
    memberUID,
    password,
    api,
}: {
    member: Member;
    memberUID: string;
    password: string;
    api: Api;
}): ThunkAction<
    Promise<void>,
    OrganizationState & OrganizationKeyState & MembersState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch) => {
        const [organizationKey, organization, addresses, memberAddresses] = await Promise.all([
            dispatch(organizationKeyThunk()),
            dispatch(organizationThunk()),
            dispatch(addressesThunk()),
            dispatch(getMemberAddresses({ member, retry: true })),
        ]);

        const organizationKeyInfo = getOrganizationKeyInfo(organization, organizationKey, addresses);
        const error = validateOrganizationKey(organizationKeyInfo);

        if (error) {
            throw new Error(error);
        }
        if (!organizationKey?.privateKey) {
            throw new Error('Missing private key');
        }

        const memberKeys = await getMemberKeys({ member, memberAddresses, organizationKey });

        if (!memberKeys.memberUserKeyPrimary) {
            throw new Error('Unable to decrypt primary member user key');
        }

        const { passphrase: newKeyPassword, salt: keySalt } = await generateKeySaltAndPassphrase(password);

        const updateKeysPayload = await getUpdateKeysPayload({
            addressesKeys: memberKeys.memberAddressesKeys,
            userKeys: memberKeys.memberUserKeys,
            organizationKey: getIsPasswordless(organizationKey.Key) ? undefined : organizationKey.privateKey,
            keyPassword: newKeyPassword,
            keySalt,
        });

        const memberApi = <T>(config: any) => api<T>(withUIDHeaders(memberUID, config));
        if (member['2faStatus']) {
            await memberApi(disable2FA({ PersistPasswordScope: true }));
        }

        await srpVerify({
            api: memberApi,
            credentials: {
                password,
            },
            config: updatePrivateKeyRoute(updateKeysPayload),
        });

        dispatch(upsertMember({ member: await getMember(api, member.ID) }));
    };
};
