import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { CryptoProxy, type PrivateKeyReference, type PublicKeyReference } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { addGroupMember as addGroupMemberApi } from '@proton/shared/lib/api/groups';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAllPublicKeys } from '@proton/shared/lib/api/keys';
import { MEMBER_PRIVATE, RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { getIsEncryptionDisabled } from '@proton/shared/lib/helpers/address';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type {
    Address,
    Api,
    ApiKeysConfig,
    CachedOrganizationKey,
    EnhancedMember,
    GetAllPublicKeysResponse,
} from '@proton/shared/lib/interfaces';
import { GroupMemberType } from '@proton/shared/lib/interfaces';
import { getAddressKeyToken, getDecryptedUserKeys, getEmailFromKey, splitKeys } from '@proton/shared/lib/keys';
import { getInternalParameters, getInternalParametersPrivate } from '@proton/shared/lib/keys/forward/forward';
import noop from '@proton/utils/noop';

import type { AddressesState } from '../addresses';
import { replaceMemberAddressTokensIfNeeded } from '../addresses/replaceAddressToken';
import { getGroupKey } from '../groups/getGroupKey';
import { disableGroupAddressEncryption } from '../groups/setGroupAddressFlags';
import type { KtState } from '../kt';
import { getMemberAddresses, membersThunk } from '../members';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import type { UserKeysState } from '../userKeys';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState & KtState;

const signMemberEmail = async (memberEmail: string, groupKey: PrivateKeyReference) => {
    return CryptoProxy.signMessage({
        textData: memberEmail,
        signingKeys: groupKey,
        signatureContext: { critical: true, value: 'account.key-token.address' },
        detached: true,
    });
};

const getPublicKeys = async ({
    api,
    memberEmail,
    getMemberPublicKeys,
}: {
    api: Api;
    memberEmail: string;
    getMemberPublicKeys: (email: string) => Promise<ApiKeysConfig>;
}): Promise<{
    forwardeeKeysConfig: ApiKeysConfig;
    forwardeeArmoredPrimaryPublicKey: string | undefined;
}> => {
    const [forwardeeKeysConfig, forwardeeAddressKeysResult] = await Promise.all([
        getMemberPublicKeys(memberEmail).catch(noop),
        // note: we might be able to remove the getter below, by changing getMemberPublicKeys
        // to also return keys for internal type external; or using a different function,
        // but there is no time for that
        api<GetAllPublicKeysResponse>(
            getAllPublicKeys({
                Email: memberEmail,
                InternalOnly: 1,
            })
        ).catch(noop),
    ]);
    let forwardeeAddressKeys;
    if (forwardeeAddressKeysResult !== undefined) {
        forwardeeAddressKeys = forwardeeAddressKeysResult.Address.Keys;
    }

    if (forwardeeKeysConfig === undefined) {
        throw new Error('Member public keys are undefined');
    }

    if (forwardeeKeysConfig.isCatchAll) {
        throw new Error('This address cannot be used as group member');
    }

    let forwardeeArmoredPrimaryPublicKey;
    if (forwardeeAddressKeys !== undefined) {
        const forwardeePublicKeys = [
            ...forwardeeKeysConfig.publicKeys.map((v) => v.armoredKey),
            ...forwardeeAddressKeys.map((v: { PublicKey: string }) => v.PublicKey),
        ];
        forwardeeArmoredPrimaryPublicKey = forwardeePublicKeys[0];
    }
    return {
        forwardeeKeysConfig,
        forwardeeArmoredPrimaryPublicKey,
    };
};

// Returns true for external addresses (e.g. pedro@gmail.com)
// and internal type external (e.g. pedro_registered_at_proton_pass@gmail.com)
const isExternalForMail = (forwardeeKeysConfig: ApiKeysConfig): boolean => {
    return forwardeeKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_EXTERNAL;
};

// Returns true for external addresses not registered at proton ONLY (e.g. pedro@gmail.com)
const isGroupMemberTypeExternal = (
    forwardeeKeysConfig: ApiKeysConfig,
    forwardeeArmoredPrimaryPublicKey: string | undefined
): boolean => {
    return isExternalForMail(forwardeeKeysConfig) && forwardeeArmoredPrimaryPublicKey === undefined;
};

// Returns true for all addresses registered at Proton
const isGroupMemberTypeInternal = (
    forwardeeKeysConfig: ApiKeysConfig,
    forwardeeArmoredPrimaryPublicKey: string | undefined
): boolean => {
    const isRecipientTypeExternal = forwardeeKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_EXTERNAL;
    const isRecipientTypeInternal = forwardeeKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_INTERNAL;
    return isRecipientTypeInternal || (isRecipientTypeExternal && forwardeeArmoredPrimaryPublicKey !== undefined);
};

const getGroupMemberType = (
    forwardeeKeysConfig: ApiKeysConfig,
    forwardeeArmoredPrimaryPublicKey: string | undefined
): GroupMemberType => {
    if (isGroupMemberTypeExternal(forwardeeKeysConfig, forwardeeArmoredPrimaryPublicKey)) {
        return GroupMemberType.External;
    } else if (isGroupMemberTypeInternal(forwardeeKeysConfig, forwardeeArmoredPrimaryPublicKey)) {
        return GroupMemberType.Internal;
    } else {
        throw new Error('Cannot figure out group member type from forwardee keys config');
    }
};

const isPrivate = (member: EnhancedMember): boolean => {
    return member.Private === MEMBER_PRIVATE.UNREADABLE;
};

const getPrimaryMemberTokenAndSignature = async ({
    member,
    forwardeeAddress,
    organizationKey,
}: {
    member: EnhancedMember;
    forwardeeAddress: Address;
    organizationKey: CachedOrganizationKey;
}) => {
    const [primaryAddressKey] = forwardeeAddress.Keys;
    if (!primaryAddressKey) {
        throw new Error('Primary address key is undefined');
    }

    const { Token, Signature } = primaryAddressKey;

    if (!Token) {
        throw new Error('Token is undefined');
    }
    if (!Signature) {
        throw new Error('Signature is undefined');
    }

    if (!organizationKey.privateKey) {
        throw new Error('Missing organization private key');
    }

    const userKeys = await getDecryptedUserKeys(member.Keys, '', organizationKey);
    if (!userKeys.length) {
        throw new Error('Member keys are not setup');
    }

    const { privateKeys, publicKeys } = splitKeys(userKeys);
    const decryptedToken = await getAddressKeyToken({
        Token: Token,
        Signature: Signature,
        privateKeys: privateKeys,
        publicKeys: publicKeys,
    });

    return {
        decryptedToken,
        Token,
        Signature,
    };
};

const getForwardeePublicKey = async (
    forwardeeArmoredPrimaryPublicKey: string | undefined
): Promise<PublicKeyReference> => {
    return CryptoProxy.importPublicKey({
        armoredKey: forwardeeArmoredPrimaryPublicKey,
    });
};

const mapProxyInstance = (proxyInstances: {
    PgpVersion: number;
    ForwarderKeyFingerprint: string;
    ForwardeeKeyFingerprint: string;
    ProxyParam: string;
}) => ({
    PgpVersion: proxyInstances.PgpVersion,
    GroupAddressKeyFingerprint: proxyInstances.ForwarderKeyFingerprint,
    GroupMemberAddressKeyFingerprint: proxyInstances.ForwardeeKeyFingerprint,
    ProxyParam: proxyInstances.ProxyParam,
});

export const addGroupMemberThunk = ({
    group: { ID: GroupID, Address: groupAddress },
    email,
    getMemberPublicKeys,
}: {
    group: { ID: string; Address: Address };
    email: string;
    getMemberPublicKeys: (email: string) => Promise<ApiKeysConfig>;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);

        const [members, organizationKey] = await Promise.all([
            dispatch(membersThunk()),
            dispatch(organizationKeyThunk()),
        ]);

        const { forwardeeKeysConfig, forwardeeArmoredPrimaryPublicKey } = await getPublicKeys({
            api,
            memberEmail: email,
            getMemberPublicKeys,
        });

        const canonicalEmail = canonicalizeInternalEmail(email);
        const member = members.find((member) =>
            member.Addresses?.some((address) => canonicalizeInternalEmail(address.Email) === canonicalEmail)
        );

        const forwarderKey = await dispatch(getGroupKey({ groupAddress }));

        const Type = getGroupMemberType(forwardeeKeysConfig, forwardeeArmoredPrimaryPublicKey);
        const AddressSignaturePacket = await signMemberEmail(canonicalEmail, forwarderKey.privateKey);

        if (isExternalForMail(forwardeeKeysConfig) && !getIsEncryptionDisabled(groupAddress)) {
            await dispatch(disableGroupAddressEncryption({ groupAddress, forwarderKey }));
        }

        if (Type === GroupMemberType.External) {
            return api(addGroupMemberApi({ Type, GroupID, Email: email, AddressSignaturePacket }));
        }

        const forwardeePublicKey = await getForwardeePublicKey(forwardeeArmoredPrimaryPublicKey);
        const Email = getEmailFromKey(forwardeePublicKey) ?? email;
        const userIDsForForwardeeKey = [{ email: Email, name: Email }];

        if (!member || isPrivate(member)) {
            const { activationToken, forwardeeKey, proxyInstances } = await getInternalParametersPrivate(
                forwarderKey.privateKey,
                userIDsForForwardeeKey,
                forwardeePublicKey
            );
            return api(
                addGroupMemberApi({
                    Type,
                    GroupID,
                    Email: canonicalEmail,
                    AddressSignaturePacket,
                    ActivationToken: activationToken,
                    GroupMemberAddressPrivateKey: forwardeeKey,
                    ProxyInstances: proxyInstances.map(mapProxyInstance),
                })
            );
        }

        await dispatch(replaceMemberAddressTokensIfNeeded({ member }));

        const memberAddresses = await dispatch(getMemberAddresses({ member, retry: true }));
        const forwardeeAddress = memberAddresses.find(
            ({ Email }) => canonicalizeInternalEmail(Email) === canonicalEmail
        );
        // Should never happen since it's previously validated in `getMember`
        if (!forwardeeAddress) {
            throw new Error('Member without matching address');
        }

        const { decryptedToken, Token, Signature } = await getPrimaryMemberTokenAndSignature({
            member,
            forwardeeAddress,
            organizationKey,
        });
        const { forwardeeKey, proxyInstances } = await getInternalParameters(
            forwarderKey.privateKey,
            userIDsForForwardeeKey,
            decryptedToken
        );
        return api(
            addGroupMemberApi({
                Type,
                GroupID,
                Email: canonicalEmail,
                AddressSignaturePacket,
                GroupMemberAddressPrivateKey: forwardeeKey,
                ProxyInstances: proxyInstances.map(mapProxyInstance),
                Token,
                Signature,
            })
        );
    };
};
