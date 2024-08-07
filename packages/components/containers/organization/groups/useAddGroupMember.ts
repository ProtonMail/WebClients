import {
    useApi,
    useAuthentication,
    useEventManager,
    useGetMembers,
    useGetOrganizationKey,
    useNotifications,
} from '@proton/components';
import type { PrivateKeyReference, PublicKeyReference } from '@proton/crypto/lib';
import { CryptoProxy } from '@proton/crypto/lib';
import type { GroupMemberParameters } from '@proton/shared/lib/api/groups';
import { addGroupMember as addGroupMemberApi } from '@proton/shared/lib/api/groups';
import { replaceAddressTokens } from '@proton/shared/lib/api/keys';
import { getAllMemberAddresses } from '@proton/shared/lib/api/members';
import { RECIPIENT_TYPES } from '@proton/shared/lib/constants';
import { MEMBER_PRIVATE, MEMBER_TYPE } from '@proton/shared/lib/constants';
import { encryptionDisabled } from '@proton/shared/lib/helpers/address';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import type {
    Address,
    ApiKeysConfig,
    DecryptedAddressKey,
    DecryptedKey,
    EnhancedMember,
    KeyPair,
    ProxyInstances,
} from '@proton/shared/lib/interfaces';
import { GroupMemberType } from '@proton/shared/lib/interfaces';
import {
    getDecryptedUserKeys,
    getEmailFromKey,
    getHasMigratedAddressKeys,
    getReplacedAddressKeyTokens,
    splitKeys,
} from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { getInternalParameters } from '../../forward/helpers';
import useGroupCrypto from './useGroupCrypto';
import useGroupKeys from './useGroupKeys';

const isExternal = (forwardeeKeysConfig: ApiKeysConfig): boolean => {
    return forwardeeKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_EXTERNAL;
};

const isInternal = (forwardeeKeysConfig: ApiKeysConfig): boolean => {
    return forwardeeKeysConfig.RecipientType === RECIPIENT_TYPES.TYPE_INTERNAL;
};

const getType = (forwardeeKeysConfig: ApiKeysConfig): GroupMemberType => {
    if (isExternal(forwardeeKeysConfig)) {
        return GroupMemberType.External;
    } else if (isInternal(forwardeeKeysConfig)) {
        return GroupMemberType.Internal;
    } else {
        throw new Error('Cannot figure out group member type from forwardee keys config');
    }
};

const isPrivate = (member: EnhancedMember): boolean => {
    return member.Private === MEMBER_PRIVATE.UNREADABLE;
};

const isManaged = (member: EnhancedMember): boolean => {
    return member.Type === MEMBER_TYPE.MANAGED;
};

const isManagedAndSameOrg = (member: EnhancedMember | undefined, forwardeeKeysConfig: ApiKeysConfig): boolean => {
    if (member === undefined) {
        return false;
    }

    const isSameOrg = isInternal(forwardeeKeysConfig);
    return isManaged(member) && isSameOrg;
};

const getForwardeePublicKey = async (memberPublicKeys: ApiKeysConfig): Promise<PublicKeyReference> => {
    const [primaryForwardeeKey] = memberPublicKeys.publicKeys;
    return CryptoProxy.importPublicKey({
        armoredKey: primaryForwardeeKey.armoredKey,
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

const useAddGroupMember = () => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const getOrganizationKey = useGetOrganizationKey();
    const { call } = useEventManager();

    const { getGroupAddressKey, getMemberPublicKeys } = useGroupKeys();

    const { signMemberEmail, disableEncryption } = useGroupCrypto();
    const getMembers = useGetMembers();
    const authentication = useAuthentication();

    const getKeys = async (
        groupAddress: Address,
        memberAddresses: Address[],
        memberEmail: string
    ): Promise<{
        forwarderKey: DecryptedAddressKey;
        forwardeeKeysConfig: ApiKeysConfig;
        forwardeeAddress: Address | undefined;
        organizationKey: KeyPair;
    }> => {
        const cachedOrganizationKey = await getOrganizationKey();
        if (cachedOrganizationKey.privateKey === undefined) {
            throw new Error('Organization key is undefined');
        }
        const organizationPrivateKey = cachedOrganizationKey.privateKey;

        if (memberAddresses === undefined) {
            throw new Error('Member addresses are undefined');
        }

        const forwardeeAddress = memberAddresses.find(({ Email }) => Email === memberEmail) as Address | undefined; // can cast to Address as addressState is full

        const [forwarderKey, forwardeeKeysConfig] = await Promise.all([
            getGroupAddressKey(groupAddress, organizationPrivateKey).catch(noop),
            getMemberPublicKeys(memberEmail).catch(noop),
        ]);

        if (forwarderKey === undefined) {
            throw new Error('Group address key is undefined');
        }

        if (forwardeeKeysConfig === undefined) {
            throw new Error('Member public keys are undefined');
        }

        if (forwardeeKeysConfig.isCatchAll) {
            throw new Error('This address cannot be used as group member');
        }

        return {
            forwarderKey,
            forwardeeKeysConfig,
            forwardeeAddress,
            organizationKey: cachedOrganizationKey,
        };
    };

    const getMember = async (email: string): Promise<EnhancedMember | undefined> => {
        const members = await getMembers();
        return members.find((member: EnhancedMember) => member.Addresses?.some((address) => address.Email === email));
    };

    const getMemberAddresses = async (member: EnhancedMember | undefined): Promise<Address[]> => {
        if (member === undefined) {
            return []; // return empty array if member is undefined
        }
        return getAllMemberAddresses(api, member.ID);
    };

    const getProxyParameters = async ({
        forwardeeKeysConfig,
        memberEmail,
        forwarderKey,
        Token,
        Signature,
        member,
        organizationKey,
    }: {
        forwardeeKeysConfig: ApiKeysConfig;
        memberEmail: string;
        forwarderKey: PrivateKeyReference;
        Token: string | undefined;
        Signature: string | undefined;
        member: EnhancedMember | undefined;
        organizationKey: KeyPair;
    }): Promise<{
        ActivationToken: string | undefined;
        GroupMemberAddressPrivateKey: string | undefined;
        ProxyInstances: ProxyInstances[] | undefined;
    }> => {
        if (!isInternal(forwardeeKeysConfig)) {
            return {
                ActivationToken: undefined,
                GroupMemberAddressPrivateKey: undefined,
                ProxyInstances: undefined,
            };
        }

        const forwardeePublicKey = await getForwardeePublicKey(forwardeeKeysConfig);
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

    const getTokenAndSignature = async ({
        member,
        forwardeeAddress,
        forwardeeKeysConfig,
    }: {
        member: EnhancedMember | undefined;
        forwardeeAddress: Address | undefined;
        forwardeeKeysConfig: ApiKeysConfig;
    }): Promise<{
        Token: string | undefined;
        Signature: string | undefined;
    }> => {
        if (
            member === undefined ||
            forwardeeAddress === undefined ||
            isPrivate(member) ||
            !isManagedAndSameOrg(member, forwardeeKeysConfig)
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

    const migrateAddressKeys = async (addresses: Address[], userKeys: DecryptedKey[]) => {
        // TODO: something like IncomingForwardActions.tsx:45 (getHasMigratedAddressKeys etc)
        if (getHasMigratedAddressKeys(addresses) && userKeys.length > 1) {
            // The token is validated with the primary user key, and this is to ensure that the address tokens are encrypted to the primary user key.
            // NOTE: Reencrypting address token happens automatically when generating a new user key, but there are users who generated user keys before that functionality existed.
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
    };

    const addGroupMemberInner = async (group: { ID: string; Address: Address }, email: string) => {
        const { ID: GroupID, Address: groupAddress } = group;

        const member: EnhancedMember | undefined = await getMember(email);
        const memberAddresses: Address[] = await getMemberAddresses(member);

        const { forwarderKey, forwardeeKeysConfig, forwardeeAddress, organizationKey } = await getKeys(
            groupAddress,
            memberAddresses,
            email
        );

        if (member !== undefined && isManagedAndSameOrg(member, forwardeeKeysConfig)) {
            // migrate address keys if needed and possible
            const keyPassword = authentication.getPassword();
            const userKeys: DecryptedKey[] = await getDecryptedUserKeys(member.Keys, keyPassword, organizationKey);

            await migrateAddressKeys(memberAddresses, userKeys);
        }

        const Type = getType(forwardeeKeysConfig);
        const canonicalEmail = canonicalizeInternalEmail(email);
        const AddressSignaturePacket = await signMemberEmail(canonicalEmail, forwarderKey.privateKey);

        if (isExternal(forwardeeKeysConfig) && !encryptionDisabled(groupAddress)) {
            await disableEncryption(groupAddress, forwarderKey);
        }

        const { Token, Signature } = await getTokenAndSignature({ member, forwardeeAddress, forwardeeKeysConfig });

        const { ActivationToken, GroupMemberAddressPrivateKey, ProxyInstances } = await getProxyParameters({
            forwardeeKeysConfig,
            memberEmail: email,
            forwarderKey: forwarderKey.privateKey,
            Token,
            Signature,
            member,
            organizationKey,
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

    const addGroupMember = async (group: { ID: string; Address: Address }, email: string) => {
        try {
            await addGroupMemberInner(group, email);
        } catch (e: unknown) {
            createNotification({ text: 'Failed to add group member', type: 'error' });
            const hasMessage = e instanceof Error || (typeof e === 'object' && e !== null && 'message' in e);
            if (hasMessage) {
                console.error(e);
            }
        }
    };

    return addGroupMember;
};

export default useAddGroupMember;
