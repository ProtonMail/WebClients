import { Api, Address, EncryptionConfig } from 'proton-shared/lib/interfaces';
import { generateAddressKey } from 'proton-shared/lib/keys/keys';
import { updateAddress } from './state';
import { Status, SetFormattedAddresses } from './interface';
import createKeyHelper from '../../keys/addKey/createKeyHelper';

interface MissingKeysSelfProcessArguments {
    api: Api;
    encryptionConfig: EncryptionConfig;
    addresses: Address[];
    password: string;
    setFormattedAddresses: SetFormattedAddresses;
}
export default ({
    api,
    encryptionConfig,
    addresses,
    password,
    setFormattedAddresses,
}: MissingKeysSelfProcessArguments) => {
    return Promise.all(
        addresses.map(async (address) => {
            try {
                setFormattedAddresses((oldState) => {
                    return updateAddress(oldState, address.ID, { status: { type: Status.LOADING } });
                });

                const { privateKey, privateKeyArmored } = await generateAddressKey({
                    email: address.Email,
                    passphrase: password,
                    encryptionConfig,
                });

                await createKeyHelper({
                    api,
                    privateKeyArmored,
                    privateKey,
                    Address: address,
                    parsedKeys: [],
                    actionableKeys: [],
                    signingKey: privateKey,
                });

                setFormattedAddresses((oldState) => {
                    return updateAddress(oldState, address.ID, { status: { type: Status.DONE } });
                });
            } catch (e) {
                setFormattedAddresses((oldState) => {
                    return updateAddress(oldState, address.ID, {
                        status: { type: Status.FAILURE, tooltip: e.message },
                    });
                });
            }
        })
    );
};
