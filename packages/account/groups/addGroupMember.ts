import { CryptoProxy, type PrivateKeyReference, type PublicKeyReference } from '@protontech/crypto';
import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType } from '@proton/redux-utilities/interface';
import {
    addGroupMember as addGroupMemberApi,
    addGroupMemberKeys as addGroupMemberKeysApi,
} from '@proton/shared/lib/api/groups';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { MEMBER_PRIVATE, RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { getIsEncryptionDisabled } from '@proton/shared/lib/helpers/address';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type {
    Address,
    ApiKeysConfig,
    CachedOrganizationKey,
    DecryptedAddressKey,
    EnhancedMember,
} from '@proton/shared/lib/interfaces';
import { GroupMemberType } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_TYPE } from '@proton/shared/lib/interfaces/GroupMember';
import type { GroupMember } from '@proton/shared/lib/interfaces/GroupMember';
import { getAddressKeyToken, getDecryptedUserKeys, getEmailFromKey, splitKeys } from '@proton/shared/lib/keys';
import { getInternalParameters, getInternalParametersPrivate } from '@proton/shared/lib/keys/forward/forward';
import { getGroupMemberPublicKeys } from '@proton/shared/lib/keys/groupKeys';
import { getMemberByEmail } from '@proton/shared/lib/keys/memberHelper';

import type { AddressesState } from '../addresses';
import { replaceMemberAddressTokensIfNeeded } from '../addresses/replaceAddressToken';
import { type GroupMembersState, groupMembersThunk } from '../groupMembers';
import { getGroupKey } from '../groups/getGroupKey';
import { type GroupsState, getGroupRoles } from '../groups/index';
import { disableGroupAddressEncryption } from '../groups/setGroupAddressFlags';
import type { KtState } from '../kt';
import { type MembersState, getMemberAddresses, membersThunk } from '../members';
import { promoteMemberToOrgAdmin } from '../members/actions';
import { type OrganizationKeyState, organizationKeyThunk } from '../organizationKey';
import { isOrgKeyRequired } from '../organizationRoles/helpers';
import type { UserKeysState } from '../userKeys';

type RequiredState = AddressesState &
    UserKeysState &
    OrganizationKeyState &
    KtState &
    GroupMembersState &
    GroupsState &
    MembersState;

const signMemberEmail = async (memberEmail: string, groupKey: PrivateKeyReference) => {
    // we must always sign using the canonical email, canonicalize even if it's already canonical
    const canonicalMemberEmail = canonicalizeInternalEmail(memberEmail);
    return CryptoProxy.signMessage({
        textData: canonicalMemberEmail,
        signingKeys: groupKey,
        signatureContext: { critical: true, value: 'account.key-token.address' },
        detached: true,
    });
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

const addGroupMemberThunk = ({
    groupId: GroupID,
    email,
    groupMemberPublicKeys: { forwardeeKeysConfig, forwardeeArmoredPrimaryPublicKey },
    forwarderKey,
}: {
    groupId: string;
    email: string;
    groupMemberPublicKeys: {
        forwardeeKeysConfig: ApiKeysConfig;
        forwardeeArmoredPrimaryPublicKey: string | undefined;
    };
    forwarderKey: DecryptedAddressKey;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const api = getSilentApi(extra.api);

        const [members, organizationKey] = await Promise.all([
            dispatch(membersThunk()),
            dispatch(organizationKeyThunk()),
        ]);

        const canonicalEmail = canonicalizeInternalEmail(email);
        const member = getMemberByEmail(members, canonicalEmail);

        const Type = getGroupMemberType(forwardeeKeysConfig, forwardeeArmoredPrimaryPublicKey);
        const AddressSignaturePacket = await signMemberEmail(canonicalEmail, forwarderKey.privateKey);

        if (Type === GroupMemberType.External) {
            return api(addGroupMemberApi({ Type, GroupID, Email: email, AddressSignaturePacket }));
        }

        const forwardeePublicKey = await getForwardeePublicKey(forwardeeArmoredPrimaryPublicKey);
        const Email = getEmailFromKey(forwardeePublicKey) ?? email;
        const userIDsForForwardeeKey = [{ email: Email, name: Email }];

        if (!member || isPrivate(member) || !organizationKey.privateKey) {
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

export const addGroupMembersThunk = ({
    group: { ID: groupId, Address: groupAddress },
    emails,
    getMemberPublicKeys,
}: {
    group: { ID: string; Address: Address };
    emails: string[];
    getMemberPublicKeys: (email: string) => Promise<ApiKeysConfig>;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        if (emails.length === 0) {
            return;
        }

        const api = getSilentApi(extra.api);
        const forwarderKey = await dispatch(getGroupKey({ groupAddress }));

        const allMemberPublicKeys = await Promise.all(
            emails.map((email) => getGroupMemberPublicKeys({ api, memberEmail: email, getMemberPublicKeys }))
        );

        // Disable group E2EE only once if any member requires it
        const shouldDisableE2EE =
            allMemberPublicKeys.some(({ forwardeeKeysConfig }) => isExternalForMail(forwardeeKeysConfig)) &&
            !getIsEncryptionDisabled(groupAddress);

        if (shouldDisableE2EE) {
            await dispatch(disableGroupAddressEncryption({ groupAddress, forwarderKey }));
        }

        const groupRoles = await dispatch(getGroupRoles({ group: { ID: groupId } }));
        const shouldPromote = groupRoles.some(({ Role }) => isOrgKeyRequired(Role));
        const members = shouldPromote ? await dispatch(membersThunk()) : [];

        // Add each member, passing pre-computed values
        const results = await Promise.allSettled(
            emails.map(async (email, index) => {
                await dispatch(
                    addGroupMemberThunk({
                        groupId,
                        email,
                        groupMemberPublicKeys: allMemberPublicKeys[index],
                        forwarderKey,
                    })
                );

                if (shouldPromote) {
                    const member = getMemberByEmail(members, canonicalizeInternalEmail(email));
                    if (member) {
                        // TODO(partial-failure): the member is added to the group but promotion may fail here.
                        // Reconcile / surface a recovery path in a follow-up MR.
                        await dispatch(promoteMemberToOrgAdmin({ member, api: extra.api }));
                    }
                }
            })
        );

        const firstError = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');

        await dispatch(groupMembersThunk({ groupId, cache: CacheType.None }));

        if (firstError) {
            throw firstError.reason;
        }
    };
};

export const addGroupMemberKeysThunk = ({
    groupMember,
    groupAddress,
    getMemberPublicKeys,
}: {
    groupMember: GroupMember;
    groupAddress: Address;
    getMemberPublicKeys: (email: string) => Promise<ApiKeysConfig>;
}): ThunkAction<Promise<void>, RequiredState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, _, extra) => {
        const email = groupMember.Email;
        if (!email) {
            throw new Error('Group member has no email');
        }

        const api = getSilentApi(extra.api);
        const forwarderKey = await dispatch(getGroupKey({ groupAddress }));
        const { forwardeeKeysConfig, forwardeeArmoredPrimaryPublicKey } = await getGroupMemberPublicKeys({
            api,
            memberEmail: email,
            getMemberPublicKeys,
        });

        // External recipients can't keep E2EE, so disable it on the group address (skip if already off).
        // NOTE: getIsEncryptionDisabled reads cached state and is therefore not safe under concurrency.
        // Once the key addition is parallelized across multiple members, do this once up front (as addGroupMembersThunk does) instead of per member.
        if (isExternalForMail(forwardeeKeysConfig) && !getIsEncryptionDisabled(groupAddress)) {
            await dispatch(disableGroupAddressEncryption({ groupAddress, forwarderKey }));
        }

        const [members, organizationKey] = await Promise.all([
            dispatch(membersThunk()),
            dispatch(organizationKeyThunk()),
        ]);

        const canonicalEmail = canonicalizeInternalEmail(email);
        const member = getMemberByEmail(members, canonicalEmail);

        const AddressSignaturePacket = await signMemberEmail(canonicalEmail, forwarderKey.privateKey);

        // Case 1 — External: no key to forward to, send email + signature only.
        if (groupMember.Type === GROUP_MEMBER_TYPE.EXTERNAL) {
            return api(addGroupMemberKeysApi(groupMember.ID, { Email: email, AddressSignaturePacket }));
        }

        // Case 2 — Internal we can't decrypt for (other org / private / no org key): build the key
        // from their public key and send an ActivationToken for them to activate it themselves.
        if (!member || isPrivate(member) || !organizationKey.privateKey) {
            const forwardeePublicKey = await getForwardeePublicKey(forwardeeArmoredPrimaryPublicKey);
            const Email = getEmailFromKey(forwardeePublicKey) ?? email;
            const userIDsForForwardeeKey = [{ email: Email, name: Email }];
            const { activationToken, forwardeeKey, proxyInstances } = await getInternalParametersPrivate(
                forwarderKey.privateKey,
                userIDsForForwardeeKey,
                forwardeePublicKey
            );
            return api(
                addGroupMemberKeysApi(groupMember.ID, {
                    Email: canonicalEmail,
                    AddressSignaturePacket,
                    ActivationToken: activationToken,
                    GroupMemberAddressPrivateKey: forwardeeKey,
                    ProxyInstances: proxyInstances.map(mapProxyInstance),
                })
            );
        }

        // Case 3 — Managed internal member: we hold the org key, so we decrypt their address
        // token ourselves and forward a ready-to-use key (no activation step needed).
        await dispatch(replaceMemberAddressTokensIfNeeded({ member }));

        const memberAddresses = await dispatch(getMemberAddresses({ member, retry: true }));
        const forwardeeAddress = memberAddresses.find(
            ({ Email }) => canonicalizeInternalEmail(Email) === canonicalEmail
        );
        if (!forwardeeAddress) {
            throw new Error('Member without matching address');
        }

        const { decryptedToken, Token, Signature } = await getPrimaryMemberTokenAndSignature({
            member,
            forwardeeAddress,
            organizationKey,
        });

        const userIDsForForwardeeKey = [{ email: canonicalEmail, name: canonicalEmail }];
        const { forwardeeKey, proxyInstances } = await getInternalParameters(
            forwarderKey.privateKey,
            userIDsForForwardeeKey,
            decryptedToken
        );
        return api(
            addGroupMemberKeysApi(groupMember.ID, {
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
