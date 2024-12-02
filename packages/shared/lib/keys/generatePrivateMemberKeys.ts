import { ADDRESS_STATUS, MEMBER_PRIVATE } from '../constants';
import type { Address, Api, DecryptedKey, KeyTransparencyVerify, UserModel as tsUserModel } from '../interfaces';
import { createAddressKeyLegacy, createAddressKeyV2 } from './add';
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
        return Promise.all(
            addressesToGenerate.map((address) => {
                return createAddressKeyV2({ // only v4 key generated for now
                    api,
                    userKeys,
                    address,
                    activeKeys: { v4: [], v6: [] },
                    keyTransparencyVerify
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
                activeKeys: { v4: [], v6: [] },
                keyTransparencyVerify,
            });
        })
    );
};
