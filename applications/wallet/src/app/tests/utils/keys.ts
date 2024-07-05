import { CryptoProxy } from '@proton/crypto/lib';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { Address, AddressKey, DecryptedAddressKey, DecryptedKey } from '@proton/shared/lib/interfaces';
import { getDecryptedAddressKey } from '@proton/shared/lib/keys';

import { addressPgpPrvKey } from '../fixtures/keys';

const address: Address = {
    ID: '0000001',
    CatchAll: true,
    DisplayName: 'My test address',
    DomainID: '0000000001',
    Email: 'test@proton.test',
    HasKeys: 1,
    Keys: [],
    SignedKeyList: { Data: '', Signature: '', MinEpochID: 0, MaxEpochID: 1 },
    Order: 0,
    Priority: 0,
    Receive: 1,
    Send: 1,
    Signature: '',
    Status: 0,
    Type: ADDRESS_TYPE.TYPE_ORIGINAL,
    ProtonMX: false,
    ConfirmationState: 1,
    Permissions: 0,
};

export const getAddressKey = async () => {
    const passphrase = 'testtest';

    const keys: DecryptedAddressKey[] = [
        await getDecryptedAddressKey(
            { ID: '0000000001', PrivateKey: addressPgpPrvKey, Primary: 1, Flags: 0 } as AddressKey,
            passphrase
        ),
    ];

    return { address, keys };
};

export const getUserKeys = async () => {
    const key1 = await CryptoProxy.importPrivateKey({ armoredKey: addressPgpPrvKey, passphrase: 'testtest' });

    const userKeys: DecryptedKey[] = [
        {
            privateKey: key1,
            publicKey: key1,
            ID: 'WALLET_TEST',
        },
    ];

    return userKeys;
};
