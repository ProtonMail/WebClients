import { c } from 'ttag';

import { acceptMembership, declineOrLeaveMembership } from '@proton/account';
import {
    useApi,
    useErrorHandler,
    useEventManager,
    useGetAddressKeys,
    useGetAddresses,
    useGetUser,
    useGetUserKeys,
    useNotifications,
} from '@proton/components';
import { CryptoProxy } from '@proton/crypto';
import type { PrivateKeyReference } from '@proton/crypto';
import { baseUseDispatch } from '@proton/react-redux-store';
import { deleteGroupMember } from '@proton/shared/lib/api/groups';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import { createAddressKeyRouteV2, replaceAddressTokens } from '@proton/shared/lib/api/keys';
import type { ActiveKey, Address, Api, GroupMembership, KeyTransparencyVerify } from '@proton/shared/lib/interfaces';
import {
    decryptMemberToken,
    getAddressKeyToken,
    getDefaultKeyFlags,
    getEmailFromKey,
    getHasMigratedAddressKeys,
    getReplacedAddressKeyTokens,
    getSignedKeyListWithDeferredPublish,
    splitKeys,
} from '@proton/shared/lib/keys';
import { getActiveKeyObject, getActiveKeys, getNormalizedActiveKeys } from '@proton/shared/lib/keys/getActiveKeys';

import { useKTVerifier } from '../..';
import useVerifyOutboundPublicKeys from '../../keyTransparency/useVerifyOutboundPublicKeys';

interface ForwardingAddressKeyParameters {
    api: Api;
    privateKey: PrivateKeyReference;
    address: Address;
    activeKeys: ActiveKey[];
    privateKeyArmored: string;
    signature: string;
    encryptedToken: string;
    groupMemberID: string;
    keyTransparencyVerify: KeyTransparencyVerify;
}

const generateGroupMemberAddressKey = async ({
    api,
    privateKey,
    address,
    activeKeys,
    privateKeyArmored,
    signature,
    encryptedToken,
    groupMemberID,
    keyTransparencyVerify,
}: ForwardingAddressKeyParameters) => {
    const newActiveKey = await getActiveKeyObject(privateKey, {
        ID: 'tmp',
        primary: 0,
        flags: getDefaultKeyFlags(address),
    });
    const updatedActiveKeys = getNormalizedActiveKeys(address, [newActiveKey]);
    const [SignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        activeKeys,
        address,
        keyTransparencyVerify
    );
    const { Key } = await api(
        createAddressKeyRouteV2({
            AddressID: address.ID,
            Primary: newActiveKey.primary,
            PrivateKey: privateKeyArmored,
            SignedKeyList,
            Signature: signature,
            Token: encryptedToken,
            GroupMemberID: groupMemberID,
        })
    );
    await onSKLPublishSuccess();
    newActiveKey.ID = Key.ID;

    return [newActiveKey, updatedActiveKeys] as const;
};

const useGroupActions = () => {
    const api = useApi();
    const handleError = useErrorHandler();
    const getUserKeys = useGetUserKeys();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();
    const verifyOutboundPublicKeys = useVerifyOutboundPublicKeys();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const getUser = useGetUser();
    const silentApi = <T>(config: any) => api<T>({ ...config, silence: true });
    const { keyTransparencyVerify, keyTransparencyCommit } = useKTVerifier(silentApi, getUser);
    const dispatch = baseUseDispatch();

    const acceptInvitation = async (membership: GroupMembership) => {
        try {
            const addresses = await getAddresses();
            const userKeys = await getUserKeys();

            if (getHasMigratedAddressKeys(addresses) && userKeys.length > 1) {
                // The token is validated with the primary user key, and this is to ensure that
                // the address tokens are encrypted to the primary user key.
                // NOTE: Reencrypting address token happens automatically when generating a new user key,
                // but there are users who generated user keys before that functionality existed.
                const primaryUserKey = userKeys[0].privateKey;
                const splitUserKeys = splitKeys(userKeys);
                const replacedResult = await getReplacedAddressKeyTokens({
                    addresses,
                    privateKeys: splitUserKeys.privateKeys,
                    privateKey: primaryUserKey,
                });
                if (replacedResult.AddressKeyTokens.length) {
                    await api(replaceAddressTokens(replacedResult));
                    await call();
                }
            }

            const addressID = membership.AddressID;
            const address = addresses.find(({ ID }) => ID === addressID);

            if (address === undefined) {
                throw Error('Address not found');
            }

            const addressKeys = await getAddressKeys(addressID);
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
                verifyOutboundPublicKeys,
                internalKeysOnly: true,
            });

            const publicKeys = await Promise.all(
                forwarderAddressKeys.map(({ armoredKey }) => CryptoProxy.importPublicKey({ armoredKey }))
            );

            let activeKeys = await getActiveKeys(address, address.SignedKeyList, address.Keys, addressKeys);

            for (const forwardingKey of [membership.Keys] || []) {
                const decryptedToken = await decryptMemberToken(
                    forwardingKey.ActivationToken,
                    splitAddressKeys.privateKeys,
                    publicKeys
                );
                let privateKey = await CryptoProxy.importPrivateKey({
                    armoredKey: forwardingKey.PrivateKey,
                    passphrase: decryptedToken,
                });
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
                    privateKey = updatedPrivateKey;
                }

                const armoredPrivateKey = await CryptoProxy.exportPrivateKey({
                    privateKey,
                    passphrase: decryptedPrimaryAddressKeyToken,
                });
                const [, updatedActiveKeys] = await generateGroupMemberAddressKey({
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
                await keyTransparencyCommit(userKeys);
                activeKeys = updatedActiveKeys;
            }
            dispatch(acceptMembership(membership));
            createNotification({ text: c('group_invitation: Success').t`Group invitation accepted` });
        } catch (error) {
            handleError(error);
        }
    };

    const declineInvitation = async (membership: GroupMembership) => {
        try {
            await api(deleteGroupMember(membership.ID));
            dispatch(declineOrLeaveMembership(membership));
            createNotification({ text: c('group_invitation: Success').t`Group invitation declined` });
        } catch (error) {
            handleError(error);
        }
    };

    const leaveMembership = async (membership: GroupMembership) => {
        try {
            await api(deleteGroupMember(membership.ID));
            dispatch(declineOrLeaveMembership(membership));
            createNotification({ text: c('group_invitation: Success').t`Left group` });
        } catch (error) {
            handleError(error);
        }
    };

    return {
        acceptInvitation,
        declineInvitation,
        leaveMembership,
    };
};

export default useGroupActions;
