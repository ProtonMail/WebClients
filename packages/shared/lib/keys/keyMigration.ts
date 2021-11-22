import { encryptPrivateKey, OpenPGPKey } from 'pmcrypto';
import { User, Address, OrganizationKey, DecryptedKey, SignedKeyList, Member, Api, Organization } from '../interfaces';
import { getDecryptedUserKeys, getDecryptedUserKeysHelper } from './getDecryptedUserKeys';
import { getDecryptedAddressKeys, getDecryptedAddressKeysHelper } from './getDecryptedAddressKeys';
import { generateAddressKeyTokens } from './addressKeys';
import { getActiveKeys } from './getActiveKeys';
import { getSignedKeyList } from './signedKeyList';
import { getPrimaryKey } from './getPrimaryKey';
import { getDecryptedOrganizationKey } from './getDecryptedOrganizationKey';
import { MEMBER_PRIVATE, USER_ROLES } from '../constants';
import { queryScopes } from '../api/auth';
import { migrateAddressKeysRoute } from '../api/keys';
import { getOrganizationKeys } from '../api/organization';
import { getAllMemberAddresses, getAllMembers, getMember } from '../api/members';
import { noop } from '../helpers/function';
import { migrateMembersAddressKeysRoute, restoreBrokenSKLRoute } from '../api/memberKeys';
import { hasBit } from '../helpers/bitset';
import isTruthy from '../helpers/isTruthy';

export const getHasMigratedAddressKey = ({ Token, Signature }: { Token?: string; Signature?: string }): boolean => {
    return !!Token && !!Signature;
};

export const getHasMigratedAddressKeys = (addresses: Address[]) => {
    return addresses.some((address) => address.Keys?.some(getHasMigratedAddressKey));
};

export const getHasMemberMigratedAddressKeys = (memberAddresses: Address[], ownerAddresses: Address[]) => {
    const primaryMemberAddress = memberAddresses[0];
    return primaryMemberAddress?.Keys?.length > 0
        ? getHasMigratedAddressKeys(memberAddresses)
        : getHasMigratedAddressKeys(ownerAddresses);
};

export const getHasKeyMigrationRunner = (value: number) => {
    return hasBit(value, 1);
};

export const getHasKeyMigrationGeneration = (value: number) => {
    return hasBit(value, 2);
};

export interface MigrateAddressKeyPayload {
    ID: string;
    Token: string;
    Signature: string;
    PrivateKey: string;
}

export interface MigrateMemberAddressKeyPayload extends MigrateAddressKeyPayload {
    OrgSignature: string;
}

interface MigrationResult {
    SignedKeyLists: { [id: string]: SignedKeyList };
    AddressKeys: MigrateAddressKeyPayload[];
}

interface MigrationOrgResult {
    SignedKeyLists: { [id: string]: SignedKeyList };
    AddressKeys: MigrateMemberAddressKeyPayload[];
}

interface AddressesKeys {
    address: Address;
    keys: DecryptedKey[];
}

export async function getAddressKeysMigrationPayload(
    addressesKeys: AddressesKeys[],
    userKey: OpenPGPKey,
    organizationKey: OpenPGPKey
): Promise<MigrationOrgResult>;

export async function getAddressKeysMigrationPayload(
    addressesKeys: AddressesKeys[],
    userKey: OpenPGPKey,
    organizationKey?: OpenPGPKey
): Promise<MigrationResult>;

export async function getAddressKeysMigrationPayload(
    addressesKeys: AddressesKeys[],
    userKey: OpenPGPKey,
    organizationKey?: OpenPGPKey
) {
    const result = await Promise.all<
        | {
              Address: Address;
              AddressKeys: MigrateAddressKeyPayload[];
              SignedKeyList: SignedKeyList;
          }
        | {
              Address: Address;
              AddressKeys: MigrateMemberAddressKeyPayload[];
              SignedKeyList: SignedKeyList;
          }
    >(
        addressesKeys.map(async ({ address, keys }) => {
            const migratedKeys = await Promise.all(
                keys.map(async ({ ID, privateKey }) => {
                    const { token, encryptedToken, signature, organizationSignature } = await generateAddressKeyTokens(
                        userKey,
                        organizationKey
                    );
                    const privateKeyArmored = await encryptPrivateKey(privateKey, token);
                    return {
                        encryptedToken,
                        signature,
                        organizationSignature,
                        privateKey,
                        privateKeyArmored,
                        ID,
                    };
                })
            );
            const activeKeys = await getActiveKeys(
                address.SignedKeyList,
                address.Keys,
                migratedKeys.map(({ ID, privateKey }) => ({
                    ID,
                    privateKey,
                    publicKey: privateKey.toPublic(),
                }))
            );
            return {
                Address: address,
                SignedKeyList: activeKeys.length > 0 ? await getSignedKeyList(activeKeys) : (undefined as any),
                AddressKeys: migratedKeys.map((migratedKey) => {
                    return {
                        ID: migratedKey.ID,
                        PrivateKey: migratedKey.privateKeyArmored,
                        Token: migratedKey.encryptedToken,
                        Signature: migratedKey.signature,
                        ...(migratedKey.organizationSignature
                            ? { OrgSignature: migratedKey.organizationSignature }
                            : undefined),
                    };
                }),
            };
        })
    );
    return result.reduce<MigrationResult | MigrationOrgResult>(
        (acc, { AddressKeys, Address, SignedKeyList }) => {
            // Some addresses may not have keys and thus won't have generated a signed key list
            if (AddressKeys.length > 0) {
                acc.AddressKeys = acc.AddressKeys.concat(AddressKeys as any); // forcing any since it's typed in the promise result above
                acc.SignedKeyLists[Address.ID] = SignedKeyList;
            }
            return acc;
        },
        { AddressKeys: [], SignedKeyLists: {} }
    );
}

interface MigrateAddressKeysArguments {
    keyPassword: string;
    user: User;
    addresses: Address[];
    organizationKey?: OrganizationKey;
}

export async function migrateAddressKeys(
    args: MigrateAddressKeysArguments & {
        organizationKey: OrganizationKey;
    }
): Promise<MigrationOrgResult>;

export async function migrateAddressKeys(args: MigrateAddressKeysArguments): Promise<MigrationResult>;

export async function migrateAddressKeys({
    user,
    addresses,
    keyPassword,
    organizationKey,
}: MigrateAddressKeysArguments) {
    const userKeys = await getDecryptedUserKeysHelper(user, keyPassword);

    const primaryUserKey = getPrimaryKey(userKeys)?.privateKey;
    if (!primaryUserKey) {
        throw new Error('Missing primary private user key');
    }

    const addressesKeys = await Promise.all(
        addresses.map(async (address) => {
            return {
                address,
                keys: await getDecryptedAddressKeysHelper(address.Keys, user, userKeys, keyPassword),
            };
        })
    );

    if (!organizationKey) {
        return getAddressKeysMigrationPayload(addressesKeys, primaryUserKey);
    }

    const decryptedOrganizationKeyResult = await getDecryptedOrganizationKey(
        organizationKey?.PrivateKey || '',
        keyPassword
    ).catch(noop);
    if (!decryptedOrganizationKeyResult) {
        throw new Error('Failed to decrypt organization key');
    }
    return getAddressKeysMigrationPayload(addressesKeys, primaryUserKey, decryptedOrganizationKeyResult.privateKey);
}

interface MigrateMemberAddressKeysArguments {
    api: Api;
    keyPassword: string;
    timeout?: number;
    user: User;
    organization: Organization;
}

export async function migrateMemberAddressKeys({
    api,
    keyPassword,
    timeout = 120000,
    user,
    organization,
}: MigrateMemberAddressKeysArguments) {
    if (organization.ToMigrate !== 1) {
        return false;
    }

    if (user.Role !== USER_ROLES.ADMIN_ROLE) {
        return;
    }

    // NOTE: The API following calls are done in a waterfall to lower the amount of unnecessary requests.
    // Ensure scope...
    const { Scopes } = await api<{ Scopes: string[] }>(queryScopes());
    if (!Scopes.includes('organization')) {
        return;
    }

    const organizationKey = await api<OrganizationKey>(getOrganizationKeys());
    // Ensure that the organization key can be decrypted...
    const decryptedOrganizationKeyResult = await getDecryptedOrganizationKey(
        organizationKey?.PrivateKey ?? '',
        keyPassword
    ).catch(noop);
    if (!decryptedOrganizationKeyResult?.privateKey) {
        return;
    }

    // Ensure that there are members to migrate...
    const members = await getAllMembers(api);
    const membersToMigrate = members.filter(({ ToMigrate, Private, Self }) => {
        return !Self && ToMigrate === 1 && Private === MEMBER_PRIVATE.READABLE;
    });
    if (!membersToMigrate.length) {
        return;
    }

    for (const member of membersToMigrate) {
        // Some members might not be setup.
        if (!member.Keys?.length) {
            continue;
        }
        const memberAddresses = await getAllMemberAddresses(api, member.ID);
        const memberUserKeys = await getDecryptedUserKeys(member.Keys, '', decryptedOrganizationKeyResult);
        const primaryMemberUserKey = getPrimaryKey(memberUserKeys)?.privateKey;
        if (!primaryMemberUserKey) {
            throw new Error('Not able to decrypt the primary member user key');
        }

        const memberAddressesKeys = (
            await Promise.all(
                memberAddresses.map(async (address) => {
                    const result = {
                        address,
                        keys: await getDecryptedAddressKeys(
                            address.Keys,
                            memberUserKeys,
                            '',
                            decryptedOrganizationKeyResult
                        ),
                    };
                    // Some non-private members don't have keys generated
                    if (!result.keys.length) {
                        return;
                    }
                    return result;
                })
            )
        ).filter(isTruthy);

        // Some members might not have keys setup for the address.
        if (!memberAddressesKeys.length) {
            continue;
        }

        const payload = await getAddressKeysMigrationPayload(
            memberAddressesKeys,
            primaryMemberUserKey,
            decryptedOrganizationKeyResult.privateKey
        );
        if (payload) {
            await api({ ...migrateMembersAddressKeysRoute({ MemberID: member.ID, ...payload }), timeout });
        }
    }
}

export const migrateUser = async ({
    api,
    user,
    addresses,
    keyPassword,
    timeout = 120000,
}: {
    api: Api;
    user: User;
    addresses: Address[];
    keyPassword: string;
    timeout?: number;
}) => {
    if (user.ToMigrate !== 1 || getHasMigratedAddressKeys(addresses)) {
        return false;
    }

    if (user.Private === MEMBER_PRIVATE.READABLE && user.Role === USER_ROLES.MEMBER_ROLE) {
        return false;
    }

    if (user.Private === MEMBER_PRIVATE.READABLE && user.Role === USER_ROLES.ADMIN_ROLE) {
        const [selfMember, organizationKey] = await Promise.all([
            api<{ Member: Member }>(getMember('me')).then(({ Member }) => Member),
            api<OrganizationKey>(getOrganizationKeys()),
        ]);
        const payload = await migrateAddressKeys({
            user,
            organizationKey,
            addresses,
            keyPassword,
        });
        await api({
            ...migrateMembersAddressKeysRoute({ MemberID: selfMember.ID, ...payload }),
            timeout,
        });
        return true;
    }

    const payload = await migrateAddressKeys({
        user,
        addresses,
        keyPassword,
    });
    await api({ ...migrateAddressKeysRoute(payload), timeout });
    return true;
};

interface RestoreBrokenSKLArguments {
    api: Api;
    keyPassword: string;
    timeout?: number;
    user: User;
}

export async function restoreBrokenSKL({ api, keyPassword, timeout = 120000, user }: RestoreBrokenSKLArguments) {
    if (user.Role !== USER_ROLES.ADMIN_ROLE) {
        return;
    }

    // NOTE: The API following calls are done in a waterfall to lower the amount of unnecessary requests.
    // Ensure scope...
    const { Scopes } = await api<{ Scopes: string[] }>(queryScopes());
    if (!Scopes.includes('organization')) {
        return;
    }

    const organizationKey = await api<OrganizationKey>(getOrganizationKeys());
    // Ensure that the organization key can be decrypted...
    const decryptedOrganizationKeyResult = await getDecryptedOrganizationKey(
        organizationKey?.PrivateKey ?? '',
        keyPassword
    ).catch(noop);
    if (!decryptedOrganizationKeyResult?.privateKey) {
        return;
    }

    // Ensure that there are members to restore...
    const members = await getAllMembers(api);
    const membersToRestore = members.filter(({ BrokenSKL }) => {
        return BrokenSKL === 1;
    });
    if (!membersToRestore.length) {
        return;
    }

    for (const member of membersToRestore) {
        // Some members might not be setup.
        if (!member.Keys?.length) {
            continue;
        }
        const memberAddresses = await getAllMemberAddresses(api, member.ID);
        const memberUserKeys = await getDecryptedUserKeys(member.Keys, '', decryptedOrganizationKeyResult);
        const primaryMemberUserKey = getPrimaryKey(memberUserKeys)?.privateKey;
        if (!primaryMemberUserKey) {
            throw new Error('Not able to decrypt the primary member user key');
        }

        const memberAddressesKeys = (
            await Promise.all(
                memberAddresses.map(async (address) => {
                    const result = {
                        address,
                        keys: await getDecryptedAddressKeys(
                            address.Keys,
                            memberUserKeys,
                            '',
                            decryptedOrganizationKeyResult
                        ),
                    };
                    // Some non-private members don't have keys generated
                    if (!result.keys.length) {
                        return;
                    }
                    return result;
                })
            )
        ).filter(isTruthy);

        // Some members might not have keys setup for the address.
        if (!memberAddressesKeys.length) {
            continue;
        }

        const signedKeyLists = await Promise.all(
            memberAddressesKeys.map(async ({ address, keys }) => {
                const activeKeys = await getActiveKeys(null, address.Keys, keys);
                return {
                    Address: address,
                    SignedKeyList: activeKeys.length > 0 ? await getSignedKeyList(activeKeys) : (undefined as any),
                };
            })
        );

        const SignedKeyLists = signedKeyLists.reduce<{ [key: string]: SignedKeyList }>((acc, cur) => {
            if (cur.SignedKeyList) {
                acc[cur.Address.ID] = cur.SignedKeyList;
            }
            return acc;
        }, {});

        if (Object.keys(SignedKeyLists).length > 0) {
            await api({ ...restoreBrokenSKLRoute({ MemberID: member.ID, SignedKeyLists }), timeout });
        }
    }
}
