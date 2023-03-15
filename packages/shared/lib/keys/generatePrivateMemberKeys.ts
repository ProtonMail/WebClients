import { ADDRESS_STATUS, MEMBER_PRIVATE } from '../constants';
import { Address, Api, DecryptedKey, KeyTransparencyVerify, UserModel as tsUserModel } from '../interfaces';
import { createAddressKeyLegacy, createAddressKeyV2 } from './add';
import { getPrimaryKey } from './getPrimaryKey';
import { getHasMigratedAddressKeys } from './keyMigration';

export const getAddressesWithKeysToGenerate = (user: tsUserModel, addresses: Address[]) => {
    // If signed in as subuser, or not a private user
    if (!user || !addresses || user.OrganizationPrivateKey || user.Private !== MEMBER_PRIVATE.UNREADABLE) {
        return [];
    }
    // Any enabled address without keys
    return addresses.filter(({ Status, Keys = [] }) => {
        return Status === ADDRESS_STATUS.STATUS_ENABLED && !Keys.length;
    });
};

interface GenerateAllPrivateMemberKeys {
    addresses: Address[];
    addressesToGenerate: Address[];
    userKeys: DecryptedKey[];
    api: Api;
    keyPassword: string;
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const generateAllPrivateMemberKeys = async ({
    addresses,
    addressesToGenerate,
    userKeys,
    keyPassword,
    api,
    keyTransparencyVerify,
}: GenerateAllPrivateMemberKeys) => {
    if (!keyPassword) {
        throw new Error('Password required to generate keys');
    }

    if (getHasMigratedAddressKeys(addresses)) {
        const primaryUserKey = getPrimaryKey(userKeys)?.privateKey;
        if (!primaryUserKey) {
            throw new Error('Missing primary user key');
        }
        return Promise.all(
            addressesToGenerate.map((address) => {
                return createAddressKeyV2({
                    api,
                    userKey: primaryUserKey,
                    address,
                    activeKeys: [],
                    keyTransparencyVerify,
                });
            })
        );
    }

    return Promise.all(
        addressesToGenerate.map((address) => {
            return createAddressKeyLegacy({
                api,
                address,
                passphrase: keyPassword,
                activeKeys: [],
                keyTransparencyVerify,
            });
        })
    );
};
