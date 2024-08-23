import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { acceptMemberUnprivatizationInfo, deleteMemberUnprivatizationInfo } from '@proton/shared/lib/api/members';
import type { Api, Member } from '@proton/shared/lib/interfaces';
import { type ParsedUnprivatizationData, acceptUnprivatization } from '@proton/shared/lib/keys';

import { addressKeysThunk } from '../addressKeys';
import { userKeysThunk } from '../userKeys';
import { type MemberState, memberThunk, updateMember } from './index';

export const getPendingUnprivatizationRequest = ({
    verifyOutboundPublicKeys,
}: {
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
}): ThunkAction<
    Promise<
        | {
              organization: Organization;
              member: Member;
              parsedUnprivatizationData: ParsedUnprivatizationData;
          }
        | undefined
    >,
    MemberState & OrganizationState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        const member = await dispatch(memberThunk());

        if (!member?.Unprivatization || member.Unprivatization.State !== MemberUnprivatizationState.Pending) {
            return;
        }

        const silentApi = getSilentApi(extra.api);

        const [addresses, organization, unprivatizationData] = await Promise.all([
            dispatch(addressesThunk()),
            dispatch(organizationThunk()),
            silentApi<MemberUnprivatizationOutput>(queryMemberUnprivatizationInfo()),
        ]);

        const parsedUnprivatizationData = await parseUnprivatizationData({ unprivatizationData, addresses });
        await validateUnprivatizationData({
            api: silentApi,
            verifyOutboundPublicKeys,
            parsedUnprivatizationData,
            expectRevisionChange: false,
        });

        return {
            member,
            organization,
            parsedUnprivatizationData,
        };
    };
};

export const memberRejectUnprivatization = ({
    api,
}: {
    member: Member;
    api: Api;
}): ThunkAction<Promise<void>, MemberState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await api(deleteMemberUnprivatizationInfo());
        dispatch(updateMember({ Unprivatization: null }));
    };
};

export const memberAcceptUnprivatization = ({
    api,
    parsedUnprivatizationData,
}: {
    parsedUnprivatizationData: ParsedUnprivatizationData;
    member: Member;
    api: Api;
}): ThunkAction<Promise<void>, MemberState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        if (parsedUnprivatizationData.type !== 'public') {
            return;
        }
        const address = parsedUnprivatizationData.payload.invitationAddress;
        const [userKeys, addressKeys] = await Promise.all([
            dispatch(userKeysThunk()),
            dispatch(addressKeysThunk({ addressID: address.ID })),
        ]);
        const payload = await acceptUnprivatization({
            userKeys: userKeys.map((key) => key.privateKey),
            addressKeys: addressKeys.map((key) => key.privateKey),
            parsedUnprivatizationData,
        });
        if (!payload) {
            return;
        }
        await api(acceptMemberUnprivatizationInfo(payload));
        dispatch(updateMember({ Unprivatization: null }));
    };
};
