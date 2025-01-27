import { c } from 'ttag';

import { acceptMembership, declineOrLeaveMembership } from '@proton/account';
import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { getKTUserContext } from '@proton/account/kt/actions';
import { useGetUser } from '@proton/account/user/hooks';
import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import useKTVerifier from '@proton/components/containers/keyTransparency/useKTVerifier';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { PrivateKeyReferenceV4 } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { useDispatch } from '@proton/redux-shared-store';
import { deleteGroupMember } from '@proton/shared/lib/api/groups';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import { replaceAddressTokens } from '@proton/shared/lib/api/keys';
import type { GroupMembership } from '@proton/shared/lib/interfaces';
import {
    decryptMemberToken,
    getAddressKeyToken,
    getEmailFromKey,
    getHasMigratedAddressKeys,
    getReplacedAddressKeyTokens,
    splitKeys,
} from '@proton/shared/lib/keys';
import { getActiveAddressKeys } from '@proton/shared/lib/keys/getActiveKeys';

import { generateForwardingAddressKey as generateGroupMemberAddressKey } from '../../forward/helpers';

const useGroupActions = () => {
    const api = useApi();
    const handleError = useErrorHandler();
    const getUserKeys = useGetUserKeys();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const getUser = useGetUser();
    const createKtVerifier = useKTVerifier();
    const dispatch = useDispatch();

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
                internalKeysOnly: true,
                ktUserContext: await dispatch(getKTUserContext()),
            });

            const publicKeys = await Promise.all(
                forwarderAddressKeys.map(({ armoredKey }) => CryptoProxy.importPublicKey({ armoredKey }))
            );

            let activeKeys = await getActiveAddressKeys(address.SignedKeyList, addressKeys);

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
            const { keyTransparencyVerify, keyTransparencyCommit } = await createKtVerifier();
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
            await keyTransparencyCommit(await getUser(), userKeys);
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
