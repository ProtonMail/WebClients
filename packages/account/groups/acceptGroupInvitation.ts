import { CryptoProxy, type PrivateKeyReferenceV4 } from '@protontech/crypto';
import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { createKTVerifier } from '@proton/key-transparency/helpers';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import type { GroupMembership } from '@proton/shared/lib/interfaces';
import {
    decryptMemberToken,
    getActiveAddressKeys,
    getAddressKeyToken,
    getEmailFromKey,
    splitKeys,
} from '@proton/shared/lib/keys';
import { generateForwardingAddressKey as generateGroupMemberAddressKey } from '@proton/shared/lib/keys/forward/keyHelpers';
import noop from '@proton/utils/noop';

import { addressKeysThunk } from '../addressKeys';
import { type AddressesState, addressesThunk } from '../addresses';
import { replaceSelfAddressTokensIfNeeded } from '../addresses/replaceAddressToken';
import { acceptMembership } from '../groupMemberships';
import { type GroupsState, groupThunk } from '../groups';
import type { KtState } from '../kt';
import { getKTActivation, getKTUserContext } from '../kt/actions';
import type { OrganizationKeyState } from '../organizationKey';
import { userThunk } from '../user';
import { type UserKeysState, userKeysThunk } from '../userKeys';
import { type UserPermissionsState, userPermissionsThunk } from '../userPermissions';

type RequiredState = AddressesState &
    UserKeysState &
    OrganizationKeyState &
    KtState &
    GroupsState &
    UserPermissionsState;

export const acceptGroupInvitation = ({
    membership,
}: {
    membership: GroupMembership;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);

        await dispatch(replaceSelfAddressTokensIfNeeded());

        const [user, addresses, userKeys] = await Promise.all([
            dispatch(userThunk()),
            dispatch(addressesThunk()),
            dispatch(userKeysThunk()),
        ]);

        const addressID = membership.AddressID;
        const address = addresses.find(({ ID }) => ID === addressID);

        if (address === undefined) {
            throw Error('Address not found');
        }

        const addressKeys = await dispatch(addressKeysThunk({ addressID }));
        const forwardeeEmail = address.Email; // get from address
        const splitUserKeys = splitKeys(userKeys);
        const splitAddressKeys = splitKeys(addressKeys);
        const [primaryAddressKey] = address.Keys;

        if (!primaryAddressKey || !primaryAddressKey.Token) {
            throw new Error('No primary address key');
        }

        const decryptedPrimaryAddressKeyToken = await getAddressKeyToken({
            Token: primaryAddressKey.Token,
            Signature: primaryAddressKey.Signature,
            privateKeys: splitUserKeys.privateKeys,
            publicKeys: splitUserKeys.publicKeys,
        });

        const { addressKeys: forwarderAddressKeys } = await getAndVerifyApiKeys({
            api,
            email: membership.Address,
            internalKeysOnly: true,
            ktUserContext: await dispatch(getKTUserContext()),
        });

        const publicKeys = await Promise.all(
            forwarderAddressKeys.map(({ armoredKey }) => CryptoProxy.importPublicKey({ armoredKey }))
        );

        const activeKeys = await getActiveAddressKeys(address.SignedKeyList, addressKeys);

        const forwardingKey = membership.Keys;
        const decryptedToken = await decryptMemberToken(
            forwardingKey.ActivationToken,
            splitAddressKeys.privateKeys,
            publicKeys
        );
        let privateKey = (await CryptoProxy.importPrivateKey({
            armoredKey: forwardingKey.PrivateKey,
            passphrase: decryptedToken,
        })) as PrivateKeyReferenceV4; // v6 keys do not support forwarding yet
        const extractedEmail = getEmailFromKey(privateKey);

        // The forwardee email address can change before the user has accepted the forwarding
        // So we need to update the private key with the email address returned by the API
        // Use strict comparison because capitalization matters
        if (extractedEmail !== forwardeeEmail) {
            const updatedPrivateKey = await CryptoProxy.cloneKeyAndChangeUserIDs({
                userIDs: [{ name: forwardeeEmail, email: forwardeeEmail }],
                privateKey,
            });
            await CryptoProxy.clearKey({ key: privateKey });
            privateKey = updatedPrivateKey as PrivateKeyReferenceV4;
        }

        const armoredPrivateKey = await CryptoProxy.exportPrivateKey({
            privateKey,
            passphrase: decryptedPrimaryAddressKeyToken,
        });
        const { keyTransparencyVerify, keyTransparencyCommit } = createKTVerifier({
            ktActivation: dispatch(getKTActivation()),
            api,
            config: extra.config,
        });
        await generateGroupMemberAddressKey({
            api,
            address,
            keyTransparencyVerify,
            groupMemberID: membership.ID,
            encryptedToken: primaryAddressKey.Token,
            signature: primaryAddressKey.Signature,
            privateKeyArmored: armoredPrivateKey,
            activeKeys,
            privateKey,
        });
        await keyTransparencyCommit(user, userKeys);
        dispatch(acceptMembership(membership));

        // The group's role assignment isn't carried in an event loop event yet.
        await Promise.all([
            dispatch(userThunk({ cache: CacheType.None })),
            dispatch(groupThunk({ cache: CacheType.None })),
            dispatch(userPermissionsThunk({ cache: CacheType.None })),
        ]).catch(noop);
    };
};
