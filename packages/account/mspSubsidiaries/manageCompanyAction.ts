import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { addressesThunk } from '@proton/account/addresses';
import type { KtState } from '@proton/account/kt';
import { getKTUserContext } from '@proton/account/kt/actions';
import { type MemberState, memberThunk } from '@proton/account/member';
import { getMemberAddresses } from '@proton/account/members';
import { type MspSubsidiariesState, mspSubsidiariesThunk } from '@proton/account/mspSubsidiaries/index';
import { type OrganizationKeyState, organizationKeyThunk } from '@proton/account/organizationKey';
import { type MemberKeyPayload, getMemberKeyPayload } from '@proton/account/organizationKey/actions';
import { userKeysThunk } from '@proton/account/userKeys';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { pullForkSession, pushForkSession } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAuthAPI, getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { assignMspSubsidiaryManager } from '@proton/shared/lib/api/msp';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { persistForkedSession } from '@proton/shared/lib/authentication/fork';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { PullForkResponse, PushForkResponse } from '@proton/shared/lib/authentication/interface';
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api, Member } from '@proton/shared/lib/interfaces';
import {
    generatePublicMemberActivation,
    getDecryptedOrganizationKeyTokenData,
    getDecryptedUserKeysHelper,
    getPrimaryKey,
} from '@proton/shared/lib/keys';

type RequiredState = OrganizationKeyState & MemberState & KtState & MspSubsidiariesState;
export const assignMemberToCompanyThunk = ({
    id,
    member,
}: {
    id: string;
    member: Member;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = extra.api;
        const [organizationKey, userKeys, subsidiaries] = await Promise.all([
            dispatch(organizationKeyThunk()),
            dispatch(userKeysThunk()),
            dispatch(mspSubsidiariesThunk()),
        ]);

        const subsidiary = subsidiaries.find((subsidiary) => subsidiary.ID === id);
        if (!subsidiary) {
            throw new Error('Unknown subsidiary id');
        }

        let memberKeyPayload: MemberKeyPayload | null = null;

        if (!subsidiary.ParentOrgToken) {
            throw new Error('Missing subsidiary organization Key');
        }
        if (!organizationKey.privateKey) {
            throw new Error('Missing organization Key');
        }
        const organizationKeyTokenData = await getDecryptedOrganizationKeyTokenData({
            armoredMessage: subsidiary.ParentOrgToken,
            decryptionKeys: [organizationKey.privateKey],
        });

        if (member.Self) {
            const primaryKey = getPrimaryKey(userKeys)?.privateKey;
            if (!primaryKey) {
                throw new Error('Missing primary key');
            }
            const addresses = await dispatch(addressesThunk());
            const address = addresses[0];
            if (!address) {
                throw new Error('Missing address');
            }
            memberKeyPayload = {
                type: 'public',
                member: member,
                email: address.Email,
                address,
                privateKey: primaryKey,
            };
        } else if (member.Private === MEMBER_PRIVATE.READABLE) {
            memberKeyPayload = await getMemberKeyPayload({
                organizationKey,
                member,
                memberAddresses: await dispatch(getMemberAddresses({ member, retry: true })),
                mode: {
                    type: 'email',
                    ktUserContext: await dispatch(getKTUserContext()),
                },
                api,
            });
        } else {
            throw new Error('Member must be non-private');
        }
        if (memberKeyPayload.type !== 'public') {
            throw new Error('Member must be non-private');
        }
        const activation = await generatePublicMemberActivation({
            data: organizationKeyTokenData,
            privateKey: memberKeyPayload.privateKey,
        });

        await api(
            assignMspSubsidiaryManager(id, member.ID, {
                OrganizationKeyActivation: {
                    TokenKeyPacket: activation.TokenKeyPacket,
                    Signature: activation.Signature,
                },
            })
        );
    };
};

const pushSelfForkWithOrganizationId = async (api: Api, ActiveOrganizationID: string) => {
    const childClientID = getClientID(APPS.PROTONACCOUNT);
    const response = await api<PushForkResponse>(
        pushForkSession({
            ChildClientID: childClientID,
            Independent: 1,
            ActiveOrganizationID,
        })
    );
    return response.Selector;
};

export const manageCompanyThunk = ({
    id,
}: {
    id: string;
}): ThunkAction<Promise<ResumedSessionResult>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const silentApi = getSilentApi(extra.api);

        if (!id) {
            throw new Error('Missing ID');
        }

        let selector: string | null = null;
        try {
            selector = await pushSelfForkWithOrganizationId(silentApi, id);
        } catch (error) {
            const me = await dispatch(memberThunk());
            const { code } = getApiError(error);
            if (code === API_CUSTOM_ERROR_CODES.ALREADY_USED) {
                await dispatch(assignMemberToCompanyThunk({ id, member: me }));
            } else {
                throw error;
            }
            selector = await pushSelfForkWithOrganizationId(silentApi, id);
        }

        const pullForkResponse = await silentApi<PullForkResponse>(pullForkSession(selector));

        const authApi = getAuthAPI(pullForkResponse.UID, pullForkResponse.AccessToken, silentApi);
        const updatedUser = await getUser(authApi);
        const keyPassword = extra.authentication.getPassword();

        const decryptedKeys = await getDecryptedUserKeysHelper(updatedUser, keyPassword);
        if (!decryptedKeys.length) {
            throw new Error('Unable to decrypt user keys with key password');
        }

        const result = await persistForkedSession({
            api: authApi,
            user: updatedUser,
            pullForkResponse,
            payload: {
                persistent: false, // Not respecting current persistent session to lessen the priority of this session for session rotation
                trusted: false,
                keyPassword,
                forkedOfflineKey: undefined,
                mode: 'sso',
                source: SessionSource.Msp,
            },
        });

        return result;
    };
};
