import { CryptoProxy } from '@proton/crypto';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { Address as tsAddress, User as tsUser } from '../../lib/interfaces';
import { getDecryptedUserKeysHelper, getReplacedAddressKeyTokens } from '../../lib/keys';
import { getAddressKey, getUserKey } from './keyDataHelper';

const getSetup = async () => {
    const keyPassword = '1';
    const userKeysFull = await Promise.all([
        getUserKey('1', keyPassword),
        getUserKey('2', keyPassword),
        getUserKey('3', keyPassword),
    ]);
    const UserKeys = userKeysFull.map(({ Key }) => Key);
    const User = {
        Keys: UserKeys,
    } as unknown as tsUser;
    const address1 = 'test@test.com';
    const address2 = 'test2@test.com';
    const address3 = 'test3@test.com';
    const userKeys = await getDecryptedUserKeysHelper(User, keyPassword);
    const addressKeysFull = await Promise.all([
        getAddressKey('a', userKeysFull[0].key.privateKey, address1),
        getAddressKey('b', userKeysFull[0].key.privateKey, address1),
        getAddressKey('c', userKeysFull[1].key.privateKey, address1),
        getAddressKey('d', userKeysFull[1].key.privateKey, address1),
        getAddressKey('e', userKeysFull[1].key.privateKey, address1),
        getAddressKey('f', userKeysFull[2].key.privateKey, address1),
    ]);
    const address2KeysFull = await Promise.all([
        getAddressKey('g', userKeysFull[0].key.privateKey, address2),
        getAddressKey('h', userKeysFull[1].key.privateKey, address2),
    ]);
    const address3KeysFull = await Promise.all([
        getAddressKey('i', userKeysFull[2].key.privateKey, address3),
        getAddressKey('j', userKeysFull[2].key.privateKey, address3),
    ]);
    const Addresses = [
        {
            ID: 'my-address',
            Email: address1,
            Keys: addressKeysFull.map(({ Key }) => Key),
        },
        {
            ID: 'my-address-2',
            Email: address2,
            Keys: address2KeysFull.map(({ Key }) => Key),
        },
        {
            ID: 'my-address-3',
            Email: address3,
            Keys: address3KeysFull.map(({ Key }) => Key),
        },
    ] as unknown as tsAddress[];
    return {
        keyPassword,
        User,
        Addresses,
        userKeys,
    };
};

describe('re-encrypt address keys', () => {
    it('should get address key tokens and re-encrypt to another user key', async () => {
        const setup = await getSetup();
        const tokens = await getReplacedAddressKeyTokens({
            userKeys: setup.userKeys,
            addresses: setup.Addresses,
            privateKey: setup.userKeys[0].privateKey,
        });
        const decryptedTokens = await Promise.all(
            tokens.AddressKeyTokens.map(async (addressKeyToken) => {
                await CryptoProxy.decryptSessionKey({
                    binaryMessage: base64StringToUint8Array(addressKeyToken.KeyPacket),
                    decryptionKeys: [setup.userKeys[0].privateKey],
                });
                return true;
            })
        );
        expect(decryptedTokens.length).toBe(setup.Addresses.reduce((acc, address) => acc + address.Keys.length, 0));
    });
});
