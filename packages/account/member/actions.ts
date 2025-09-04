import type { UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { removeAddressKeyRoute, removeUserKeyRoute } from '@proton/shared/lib/api/keys';
import {
    acceptMemberUnprivatizationInfo,
    deleteMemberUnprivatizationInfo,
    queryMemberUnprivatizationInfo,
} from '@proton/shared/lib/api/members';
import type {
    Address,
    Api,
    InactiveKey,
    Member,
    MemberUnprivatizationOutput,
    Organization,
} from '@proton/shared/lib/interfaces';
import {
    type ParsedUnprivatizationData,
    acceptUnprivatization,
    getIsMemberInManualAcceptState,
    parseUnprivatizationData,
    validateUnprivatizationData,
} from '@proton/shared/lib/keys';

import { addressKeysThunk } from '../addressKeys';
import { type AddressesState, addressesThunk } from '../addresses';
import { type InactiveKeysState, selectInactiveKeys } from '../inactiveKeys';
import type { KtState } from '../kt';
import { getKTUserContext } from '../kt/actions';
import { type OrganizationState, organizationThunk } from '../organization';
import { userThunk } from '../user';
import { userKeysThunk } from '../userKeys';
import { type MemberState, updateMember } from './index';

export const getPendingUnprivatizationRequest = ({
    member,
}: {
    member: Member;
}): ThunkAction<
    Promise<
        | {
              organization: Organization;
              parsedUnprivatizationData: ParsedUnprivatizationData;
          }
        | undefined
    >,
    KtState & MemberState & OrganizationState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _, extra) => {
        if (!getIsMemberInManualAcceptState(member)) {
            return;
        }

        const silentApi = getSilentApi(extra.api);

        const [user, addresses, organization, unprivatizationData] = await Promise.all([
            dispatch(userThunk()),
            dispatch(addressesThunk()),
            dispatch(organizationThunk()),
            silentApi<MemberUnprivatizationOutput>(queryMemberUnprivatizationInfo()),
        ]);

        if (!user.Keys?.length) {
            // If the user isn't setup, ignore this unprivatization request. The user can't act on it anyway.
            // This can happen for VPN SSO users that get promoted to admin (gets converted to global SSO) before
            // the user has setup a backup password.
            return;
        }

        const parsedUnprivatizationData = await parseUnprivatizationData({ unprivatizationData, addresses });
        await validateUnprivatizationData({
            api: silentApi,
            ktUserContext: await dispatch(getKTUserContext()),
            parsedUnprivatizationData,
            // For unprivatization (subuser side) it's not necessary to validate revision
            options: {
                validateRevision: false,
                newMemberCreation: false,
            },
        });

        return {
            organization,
            parsedUnprivatizationData,
        };
    };
};

export const deleteAllInactiveKeys = ({
    api,
}: {
    api: Api;
}): ThunkAction<Promise<boolean>, AddressesState & InactiveKeysState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState) => {
        const inactiveKeys = selectInactiveKeys(getState());

        const inactiveUserKeys = inactiveKeys.user;
        const inactiveAddressesKeys = Object.entries(inactiveKeys.addresses).flatMap(([addressID, inactiveKeys]) => {
            if (!inactiveKeys.length) {
                return [];
            }
            return [{ addressID, inactiveKeys }];
        });

        if (!inactiveUserKeys.length && !inactiveAddressesKeys.length) {
            return false;
        }

        const addresses = await dispatch(addressesThunk());
        const addressesMap = addresses.reduce<{ [id: string]: Address }>((acc, address) => {
            acc[address.ID] = address;
            return acc;
        }, {});

        const deleteInactiveAddressKeys = async ({
            addressID,
            inactiveKeys: inactiveAddressKeys,
        }: {
            addressID: string;
            inactiveKeys: InactiveKey[];
        }) => {
            const address = addressesMap[addressID];
            const signedKeyList = address?.SignedKeyList || null;

            await Promise.all(
                inactiveAddressKeys.map(({ Key }: InactiveKey) => {
                    return api(removeAddressKeyRoute({ ID: Key.ID, SignedKeyList: signedKeyList }));
                })
            );
        };

        await Promise.all(inactiveAddressesKeys.map(deleteInactiveAddressKeys));

        await Promise.all(
            inactiveUserKeys.map(({ Key }) => {
                return api(removeUserKeyRoute({ ID: Key.ID }));
            })
        );

        return true;
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
        const deletedInactiveKeys = await dispatch(deleteAllInactiveKeys({ api }));
        await api(acceptMemberUnprivatizationInfo(payload));
        dispatch(updateMember({ Unprivatization: null }));
        // Refetch the user (and addresses) so that the relevant fields get updated (mostly the Private field)
        dispatch(userThunk({ cache: CacheType.None }));
        if (deletedInactiveKeys) {
            dispatch(addressesThunk({ cache: CacheType.None }));
        }
    };
};
