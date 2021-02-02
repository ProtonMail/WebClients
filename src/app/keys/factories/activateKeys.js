import { encryptPrivateKey } from 'pmcrypto';
import { MAIN_KEY } from '../../constants';
import { getKeyInfo } from '../../../helpers/key';

/* @ngInject */
function activateKeys(keysModel, setupKeys, Key, $injector) {
    const formatKey = ({ key, pkg, address }) => {
        key.decrypted = true;
        return getKeyInfo(key).then((key) => ({ address, key, pkg }));
    };

    const activateKey = async ({ key, pkg, mailboxPassword, address }) => {
        const encryptedPrivateKey = await encryptPrivateKey(pkg, mailboxPassword);
        const SignedKeyList = await keysModel.signedKeyList(address.ID, {
            mode: 'create',
            decryptedPrivateKey: pkg,
            encryptedPrivateKey
        });

        await Key.activate(key.ID, { PrivateKey: encryptedPrivateKey, SignedKeyList });
    };

    return async (addresses, mailboxPassword) => {
        const addressKeysToActivate = addresses.filter(({ Keys = [] }) => {
            return Keys.some(({ Activation }) => !!Activation);
        });

        if (addressKeysToActivate.length === 0) {
            return;
        }

        const userKeys = keysModel.getPrivateKeys(MAIN_KEY);

        const activateAddressKeys = async (address) => {
            for (const Key of address.Keys) {
                const { Activation } = Key;
                if (!Activation) {
                    // eslint-disable-next-line no-continue
                    continue;
                }
                try {
                    const decryptedKey = await setupKeys.decryptMemberKey(Key, userKeys);
                    await activateKey({ key: Key, pkg: decryptedKey, mailboxPassword, address });
                    const formattedKey = await formatKey({ key: Key, pkg: decryptedKey, address });
                    keysModel.storeKeys([formattedKey]);
                } catch (error) {
                    $injector.get('bugReportApi').crash(error);
                }
            }
        };

        await Promise.all(addressKeysToActivate.map(activateAddressKeys));
    };
}
export default activateKeys;
