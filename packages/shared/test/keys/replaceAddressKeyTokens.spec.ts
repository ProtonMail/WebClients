import { CryptoProxy } from '@proton/crypto';

import type { Address as tsAddress, User as tsUser } from '../../lib/interfaces';
import { getDecryptedUserKeysHelper, getReplacedAddressKeyTokens, splitKeys } from '../../lib/keys';
import { getAddressKey, getUserKey } from './keyDataHelper';

const getSetup = async (forceSameUserKey = false) => {
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
    const getUserPrivateKey = (index: number) => {
        return userKeysFull[forceSameUserKey ? 0 : index].key.privateKey;
    };
    const addressKeysFull = await Promise.all([
        getAddressKey('a', getUserPrivateKey(0), address1),
        getAddressKey('b', getUserPrivateKey(0), address1),
        getAddressKey('c', getUserPrivateKey(1), address1),
        getAddressKey('d', getUserPrivateKey(1), address1),
        getAddressKey('e', getUserPrivateKey(1), address1),
        getAddressKey('f', getUserPrivateKey(2), address1),
    ]);
    const address2KeysFull = await Promise.all([
        getAddressKey('g', getUserPrivateKey(0), address2),
        getAddressKey('h', getUserPrivateKey(1), address2),
    ]);
    const address3KeysFull = await Promise.all([
        getAddressKey('i', getUserPrivateKey(2), address3),
        getAddressKey('j', getUserPrivateKey(2), address3),
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
        privateKeys: splitKeys(userKeys).privateKeys,
    };
};

describe('re-encrypt address keys', () => {
    it('should get address key tokens and re-encrypt to another user key', async () => {
        const setup = await getSetup();
        const tokens = await getReplacedAddressKeyTokens({
            addresses: setup.Addresses,
            privateKey: setup.userKeys[0].privateKey,
            privateKeys: setup.privateKeys,
        });
        const decryptedTokens = await Promise.all(
            tokens.AddressKeyTokens.map(async (addressKeyToken) => {
                await CryptoProxy.decryptSessionKey({
                    binaryMessage: Uint8Array.fromBase64(addressKeyToken.KeyPacket),
                    decryptionKeys: [setup.userKeys[0].privateKey],
                });
                return true;
            })
        );
        expect(decryptedTokens.length).toBe(7);
    });

    it('should not re-encrypt tokens to the same user key', async () => {
        const setup = await getSetup(true);
        const tokens = await getReplacedAddressKeyTokens({
            addresses: setup.Addresses,
            privateKey: setup.userKeys[0].privateKey,
            privateKeys: setup.privateKeys,
        });
        const decryptedTokens = await Promise.all(
            tokens.AddressKeyTokens.map(async (addressKeyToken) => {
                await CryptoProxy.decryptSessionKey({
                    binaryMessage: Uint8Array.fromBase64(addressKeyToken.KeyPacket),
                    decryptionKeys: [setup.userKeys[0].privateKey],
                });
                return true;
            })
        );
        expect(decryptedTokens.length).toBe(0);
    });
});
