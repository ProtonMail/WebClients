import _ from 'lodash';
import { decryptPrivateKey, getKeys, keyInfo, reformatKey } from 'pmcrypto';

/* @ngInject */
function importPrivateKey(
    decryptImportKeyModal,
    addressesModel,
    authentication,
    Key,
    keysModel,
    notification,
    unlockUser,
    gettextCatalog
) {
    const PRIVATE_KEY_EXPR = /-----BEGIN PGP PRIVATE KEY BLOCK-----(?:(?!-----)[\s\S])*-----END PGP PRIVATE KEY BLOCK-----/g;

    const extractPrivateKeys = async (file, keyObj) => {
        const privateKeys = file.match(PRIVATE_KEY_EXPR) || [];

        if (!keyObj) {
            return privateKeys;
        }

        const [serverKeyInfo, uploadedKeyInfos] = await Promise.all([
            keyInfo(keyObj.PrivateKey),
            Promise.all(privateKeys.map(keyInfo))
        ]);
        const index = uploadedKeyInfos.findIndex(({ fingerprint }) => serverKeyInfo.fingerprint === fingerprint);

        if (index < 0) {
            throw new Error(
                gettextCatalog.getString("Uploaded key doesn't match selected key.", null, 'Error message')
            );
        }
        return [privateKeys[index]];
    };

    const decrypt = (file) => {
        return keyInfo(file).then(
            ({ decrypted = null, fingerprint }) => {
                if (decrypted !== false) {
                    return getKeys(file);
                }

                return new Promise((resolve, reject) =>
                    decryptImportKeyModal.activate({
                        params: {
                            privateKey: file,
                            fingerprint,
                            submit(decryptedKey) {
                                decryptImportKeyModal.deactivate();
                                resolve(decryptedKey);
                            },
                            cancel() {
                                decryptImportKeyModal.deactivate();
                                reject();
                            }
                        }
                    })
                );
            },
            (err) => {
                notification.error(gettextCatalog.getString('Unsupported key', null, 'Error'));
                throw err;
            }
        );
    };

    const decryptAll = (privateKeys) =>
        Promise.all(privateKeys.map(decrypt))
            .then(_.flatten)
            .catch(() => null);

    const reformat = (privateKeys, email) => {
        const passphrase = authentication.getPassword();
        return Promise.all(
            privateKeys.map(async (privateKey) => {
                const { privateKeyArmored } = await reformatKey({
                    privateKey,
                    userIds: [{ name: email, email }],
                    passphrase
                });
                return privateKeyArmored;
            })
        );
    };

    const createKey = async (encryptedPrivateKey, addressID, keyID) => {
        const SignedKeyList = await keysModel.signedKeyList(addressID, {
            mode: 'create',
            decryptedPrivateKey: await decryptPrivateKey(encryptedPrivateKey, authentication.getPassword()),
            encryptedPrivateKey
        });
        const promise = addressID
            ? Key.create({ AddressID: addressID, PrivateKey: encryptedPrivateKey, Primary: 0, SignedKeyList })
            : Key.reactivate(keyID, { PrivateKey: encryptedPrivateKey, SignedKeyList });
        return promise
            .then(() => 1)
            .catch((error) => {
                !error.noNotify &&
                    notification.error(error.data && error.data.Error ? error.data.Error : error.message);
                return 0;
            });
    };

    const createKeys = async (privateKeys, addressID, keyid) => {
        await unlockUser();
        const result = await Promise.all(privateKeys.map((privateKey) => createKey(privateKey, addressID, keyid)));
        return _.sum(result);
    };

    const importDecryptedKeys = async (decryptedKeys, email, { PrivateKey, ID } = {}) => {
        const { ID: addressID = false } = addressesModel.get().find(({ Email }) => Email === email) || {};

        if (!addressID) {
            const pmKey = await getKeys(PrivateKey);
            const [, , email] = pmKey[0].users[0].userId.userid.split(/(<|>)/g);

            // fallback on keyid: happens when reactivating keys
            const formattedKeys = await reformat(decryptedKeys, email);
            return createKeys(formattedKeys, addressID, ID);
        }

        const formattedKeys = await reformat(decryptedKeys, email);
        return createKeys(formattedKeys, addressID, ID);
    };

    const importKey = async (file, email, keyObj) => {
        const privateKeys = await extractPrivateKeys(file, keyObj);
        if (privateKeys.length === 0) {
            throw new Error(gettextCatalog.getString('Invalid private key file.', null, 'Error message'));
        }

        const decryptedKeys = await decryptAll(privateKeys);
        if (decryptedKeys === null) {
            // handle cancel button
            return 0;
        }

        return importDecryptedKeys(decryptedKeys, email, keyObj);
    };

    return { importKey };
}
export default importPrivateKey;
