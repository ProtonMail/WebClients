import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import { CryptoProxy, type PrivateKeyReference, type PublicKeyReference } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { addGroupMember as addGroupMemberApi } from '@proton/shared/lib/api/groups';
import type { GroupMemberParameters } from '@proton/shared/lib/api/groups';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAllPublicKeys } from '@proton/shared/lib/api/keys';
import { MEMBER_PRIVATE, RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { getIsEncryptionDisabled } from '@proton/shared/lib/helpers/address';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type {
    Address,
    Api,
    ApiKeysConfig,
    EnhancedMember,
    GetAllPublicKeysResponse,
    KeyPair,
    ProxyInstances,
} from '@proton/shared/lib/interfaces';
import { GroupMemberType } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeys, getEmailFromKey, splitKeys } from '@proton/shared/lib/keys';
import { getInternalParameters } from '@proton/shared/lib/keys/forward/forward';
import noop from '@proton/utils/noop';

import { type AddressesState } from '../addresses';
import { replaceMemberAddressTokensIfNeeded } from '../addresses/replaceAddressToken';
import { getGroupKey } from '../groups/getGroupKey';
import { disableGroupAddressEncryption } from '../groups/setGroupAddressFlags';
import type { KtState } from '../kt';
import { getMemberAddresses, membersThunk } from '../members';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { type UserKeysState } from '../userKeys';

type RequiredState = AddressesState & UserKeysState & OrganizationKeyState & KtState;

const getMember = (members: EnhancedMember[], email: string) => {
    return members.find((member: EnhancedMember) => member.Addresses?.some((address) => address.Email === email));
};

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

const isSameOrg = (
    forwardeeKeysConfig: ApiKeysConfig,
    forwardeeArmoredPrimaryPublicKey: string | undefined
): boolean => {
    return isGroupMemberTypeInternal(forwardeeKeysConfig, forwardeeArmoredPrimaryPublicKey);
};

const isManagedAndSameOrg = (
    member: EnhancedMember | undefined,
    forwardeeKeysConfig: ApiKeysConfig,
    forwardeeArmoredPrimaryPublicKey: string | undefined
): boolean => {
    if (member === undefined) {
        return false;
    }

    return !isPrivate(member) && isSameOrg(forwardeeKeysConfig, forwardeeArmoredPrimaryPublicKey);
};

const getTokenAndSignature = async ({
    member,
    forwardeeAddress,
    forwardeeKeysConfig,
    forwardeeArmoredPrimaryPublicKey,
}: {
    member: EnhancedMember | undefined;
    forwardeeAddress: Address | undefined;
    forwardeeKeysConfig: ApiKeysConfig;
    forwardeeArmoredPrimaryPublicKey: string | undefined;
}): Promise<{
    Token: string | undefined;
    Signature: string | undefined;
}> => {
    if (
        member === undefined ||
        forwardeeAddress === undefined ||
        isPrivate(member) ||
        !isSameOrg(forwardeeKeysConfig, forwardeeArmoredPrimaryPublicKey)
    ) {
        return {
            Token: undefined,
            Signature: undefined,
        };
    }

    const [primaryAddressKey] = forwardeeAddress.Keys;
    if (primaryAddressKey === undefined) {
        throw new Error('Primary address key is undefined');
    }

    const { Token, Signature } = primaryAddressKey;

    if (Token === undefined) {
        throw new Error('Token is undefined');
    }

    if (Signature === undefined) {
        throw new Error('Signature is undefined');
    }

    return {
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

const getProxyParameters = async ({
    forwardeeKeysConfig,
    memberEmail,
    forwarderKey,
    Token,
    Signature,
    member,
    organizationKey,
    forwardeeArmoredPrimaryPublicKey,
}: {
    forwardeeKeysConfig: ApiKeysConfig;
    memberEmail: string;
    forwarderKey: PrivateKeyReference;
    Token: string | undefined;
    Signature: string | undefined;
    member: EnhancedMember | undefined;
    organizationKey: KeyPair;
    forwardeeArmoredPrimaryPublicKey: string | undefined;
}): Promise<{
    ActivationToken: string | undefined;
    GroupMemberAddressPrivateKey: string | undefined;
    ProxyInstances: ProxyInstances[] | undefined;
}> => {
    if (!isGroupMemberTypeInternal(forwardeeKeysConfig, forwardeeArmoredPrimaryPublicKey)) {
        return {
            ActivationToken: undefined,
            GroupMemberAddressPrivateKey: undefined,
            ProxyInstances: undefined,
        };
    }

    const forwardeePublicKey = await getForwardeePublicKey(forwardeeArmoredPrimaryPublicKey);
    const Email = getEmailFromKey(forwardeePublicKey) ?? memberEmail;

    let userKeys = undefined;

    if (member) {
        userKeys = await getDecryptedUserKeys(member.Keys, '', organizationKey);
    }

    const { privateKeys, publicKeys } = splitKeys(userKeys);

    const {
        activationToken,
        forwardeeKey: GroupMemberAddressPrivateKey,
        proxyInstances,
    } = await getInternalParameters(
        forwarderKey,
        [{ email: Email, name: Email }],
        forwardeePublicKey,
        Token,
        Signature,
        privateKeys,
        publicKeys
    );

    return {
        ActivationToken: activationToken,
        GroupMemberAddressPrivateKey,
        ProxyInstances: proxyInstances.map(mapProxyInstance),
    };
};

export const addGroupMemberThunk = ({
    group,
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
        const { ID: GroupID, Address: groupAddress } = group;

        const { forwardeeKeysConfig, forwardeeArmoredPrimaryPublicKey } = await getPublicKeys({
            api,
            memberEmail: email,
            getMemberPublicKeys,
        });

        const member = getMember(members, email);
        if (member && isManagedAndSameOrg(member, forwardeeKeysConfig, forwardeeArmoredPrimaryPublicKey)) {
            await dispatch(replaceMemberAddressTokensIfNeeded({ member }));
        }

        const forwarderKey = await dispatch(getGroupKey({ groupAddress }));

        const Type = getGroupMemberType(forwardeeKeysConfig, forwardeeArmoredPrimaryPublicKey);
        const canonicalEmail = canonicalizeInternalEmail(email);
        const AddressSignaturePacket = await signMemberEmail(canonicalEmail, forwarderKey.privateKey);

        if (isExternalForMail(forwardeeKeysConfig) && !getIsEncryptionDisabled(groupAddress)) {
            await dispatch(disableGroupAddressEncryption({ groupAddress, forwarderKey }));
        }

        const memberAddresses = member ? await dispatch(getMemberAddresses({ member, retry: true })) : [];
        const forwardeeAddress = memberAddresses.find(({ Email }) => Email === email);

        const { Token, Signature } = await getTokenAndSignature({
            member,
            forwardeeAddress,
            forwardeeKeysConfig,
            forwardeeArmoredPrimaryPublicKey,
        });

        if (!organizationKey.privateKey) {
            throw new Error('Missing private key');
        }
        const organizationKeyPair: KeyPair = {
            privateKey: organizationKey.privateKey,
            publicKey: organizationKey.publicKey,
        };
        const { ActivationToken, GroupMemberAddressPrivateKey, ProxyInstances } = await getProxyParameters({
            forwardeeKeysConfig,
            memberEmail: email,
            forwarderKey: forwarderKey.privateKey,
            Token,
            Signature,
            member,
            organizationKey: organizationKeyPair,
            forwardeeArmoredPrimaryPublicKey,
        });

        const apiParams: GroupMemberParameters = {
            Type,
            GroupID,
            Email: email,
            AddressSignaturePacket,
            ActivationToken,
            GroupMemberAddressPrivateKey,
            ProxyInstances,
            Token,
            Signature,
        };

        await api(addGroupMemberApi(apiParams));
    };
};
