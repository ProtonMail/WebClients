import { CryptoProxy, PrivateKeyReference, toPublicKeyReference } from '@proton/crypto';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { queryScopes } from '../api/auth';
import { getApiError } from '../api/helpers/apiErrorHelper';
import { migrateAddressKeysRoute } from '../api/keys';
import { migrateMembersAddressKeysRoute } from '../api/memberKeys';
import { getAllMemberAddresses, getAllMembers, getMember } from '../api/members';
import { getOrganizationKeys } from '../api/organization';
import { MEMBER_PRIVATE, USER_ROLES } from '../constants';
import { ApiError } from '../fetch/ApiError';
import {
    Address,
    Api,
    DecryptedKey,
    KeyMigrationKTVerifier,
    KeyTransparencyVerify,
    Member,
    Organization,
    OrganizationKey,
    PreAuthKTVerify,
    SignedKeyList,
    User,
} from '../interfaces';
import { generateAddressKeyTokens } from './addressKeys';
import { getDecryptedAddressKeys, getDecryptedAddressKeysHelper } from './getDecryptedAddressKeys';
import { getDecryptedOrganizationKey } from './getDecryptedOrganizationKey';
import { getDecryptedUserKeys, getDecryptedUserKeysHelper } from './getDecryptedUserKeys';
import { getPrimaryKey } from './getPrimaryKey';
import { createSignedKeyListForMigration } from './signedKeyList';

export const getSentryError = (e: any): any => {
    // Only interested in api errors where the API gave a valid error response, or run time errors.
    if (e instanceof ApiError) {
        const { message, code } = getApiError(e);
        return message && code >= 400 && code < 500 ? message : null;
    }
    return e;
};

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
    userKey: PrivateKeyReference,
    keyTransparencyVerify: KeyTransparencyVerify,
    keyMigrationKTVerifier: KeyMigrationKTVerifier,
    organizationKey: PrivateKeyReference
): Promise<MigrationOrgResult>;

export async function getAddressKeysMigrationPayload(
    addressesKeys: AddressesKeys[],
    userKey: PrivateKeyReference,
    keyTransparencyVerify: KeyTransparencyVerify,
    keyMigrationKTVerifier: KeyMigrationKTVerifier,
    organizationKey?: PrivateKeyReference
): Promise<MigrationResult>;

export async function getAddressKeysMigrationPayload(
    addressesKeys: AddressesKeys[],
    userKey: PrivateKeyReference,
    keyTransparencyVerify: KeyTransparencyVerify,
    keyMigrationKTVerifier: KeyMigrationKTVerifier,
    organizationKey?: PrivateKeyReference
) {
    const result = await Promise.all<
        | {
              Address: Address;
              AddressKeys: MigrateAddressKeyPayload[];
              SignedKeyList: SignedKeyList | undefined;
          }
        | {
              Address: Address;
              AddressKeys: MigrateMemberAddressKeyPayload[];
              SignedKeyList: SignedKeyList | undefined;
          }
    >(
        addressesKeys.map(async ({ address, keys }) => {
            const migratedKeys = await Promise.all(
                keys.map(async ({ ID, privateKey }) => {
                    const { token, encryptedToken, signature, organizationSignature } = await generateAddressKeyTokens(
                        userKey,
                        organizationKey
                    );
                    const privateKeyArmored = await CryptoProxy.exportPrivateKey({
                        privateKey,
                        passphrase: token,
                    });
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
            const migratedDecryptedKeys = await Promise.all(
                migratedKeys.map(async ({ ID, privateKey }) => ({
                    ID,
                    privateKey,
                    publicKey: await toPublicKeyReference(privateKey),
                }))
            );
            const signedKeyList = await createSignedKeyListForMigration(
                address,
                migratedDecryptedKeys,
                keyTransparencyVerify,
                keyMigrationKTVerifier
            );
            return {
                Address: address,
                SignedKeyList: signedKeyList,
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
                if (SignedKeyList) {
                    acc.SignedKeyLists[Address.ID] = SignedKeyList;
                }
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
    preAuthKTVerify: PreAuthKTVerify;
    keyMigrationKTVerifier: KeyMigrationKTVerifier;
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
    preAuthKTVerify,
    keyMigrationKTVerifier,
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

    const keyTransparencyVerify = preAuthKTVerify(userKeys);

    if (!organizationKey) {
        return getAddressKeysMigrationPayload(
            addressesKeys,
            primaryUserKey,
            keyTransparencyVerify,
            keyMigrationKTVerifier
        );
    }

    const decryptedOrganizationKeyResult = await getDecryptedOrganizationKey(
        organizationKey?.PrivateKey || '',
        keyPassword
    ).catch(noop);
    if (!decryptedOrganizationKeyResult) {
        throw new Error('Failed to decrypt organization key');
    }
    return getAddressKeysMigrationPayload(
        addressesKeys,
        primaryUserKey,
        keyTransparencyVerify,
        keyMigrationKTVerifier,
        decryptedOrganizationKeyResult.privateKey
    );
}

interface MigrateMemberAddressKeysArguments {
    api: Api;
    keyPassword: string;
    timeout?: number;
    user: User;
    organization: Organization;
    keyTransparencyVerify: KeyTransparencyVerify;
    keyMigrationKTVerifier: KeyMigrationKTVerifier;
}

export async function migrateMemberAddressKeys({
    api,
    keyPassword,
    timeout = 120000,
    user,
    organization,
    keyTransparencyVerify,
    keyMigrationKTVerifier,
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
            keyTransparencyVerify,
            keyMigrationKTVerifier,
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
    preAuthKTVerify,
    keyMigrationKTVerifier,
}: {
    api: Api;
    user: User;
    addresses: Address[];
    keyPassword: string;
    timeout?: number;
    preAuthKTVerify: PreAuthKTVerify;
    keyMigrationKTVerifier: KeyMigrationKTVerifier;
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
            keyMigrationKTVerifier,
            preAuthKTVerify,
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
        preAuthKTVerify,
        keyMigrationKTVerifier,
    });
    await api({ ...migrateAddressKeysRoute(payload), timeout });
    return true;
};
