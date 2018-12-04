import _ from 'lodash';

/* @ngInject */
function importPrivateKey(
    pmcw,
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
    const getKeyObject = (keyid) => {
        // Get all keys, even invalid
        const keys = authentication.user.Keys.concat(_.flatten(_.map(addressesModel.get(), 'Keys')));
        return keys.find(({ ID }) => ID === keyid);
    };

    const extractPrivateKeys = async (file, keyid) => {
        const privateKeys = file.match(PRIVATE_KEY_EXPR) || [];

        if (keyid) {
            const keyObj = getKeyObject(keyid);
            const [serverKeyInfo, uploadedKeyInfos] = await Promise.all([
                pmcw.keyInfo(keyObj.PrivateKey),
                Promise.all(privateKeys.map(pmcw.keyInfo))
            ]);
            const index = uploadedKeyInfos.findIndex(({ fingerprint }) => serverKeyInfo.fingerprint === fingerprint);

            if (index < 0) {
                throw new Error(
                    gettextCatalog.getString("Uploaded key doesn't match selected key.", null, 'Error message')
                );
            }
            return [privateKeys[index]];
        }
        return privateKeys;
    };

    const decrypt = (file) => {
        return pmcw.keyInfo(file).then(
            ({ decrypted = null, fingerprint }) => {
                if (decrypted !== false) {
                    return pmcw.getKeys(file);
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
    const reformat = (privateKeys, email) =>
        Promise.all(privateKeys.map((privKey) => pmcw.reformatKey(privKey, email, authentication.getPassword())));

    const createKey = async (privateKey, addressID, keyID) => {
        const SignedKeyList = await keysModel.signedKeyList(addressID, { mode: 'create', keyID, privateKey });
        const promise = addressID
            ? Key.create({ AddressID: addressID, PrivateKey: privateKey, Primary: 0, SignedKeyList })
            : Key.reactivate(keyID, { PrivateKey: privateKey, SignedKeyList });
        return promise
            .then(() => 1)
            .catch((error) => {
                !error.noNotify &&
                    notification.error(error.data && error.data.Error ? error.data.Error : error.message);
                return 0;
            });
    };

    const createKeys = (privateKeys, addressID, keyid) => {
        return unlockUser()
            .then(() => Promise.all(privateKeys.map((privateKey) => createKey(privateKey, addressID, keyid))))
            .then(_.sum);
    };

    const importDecryptedKeys = async (decryptedKeys, email, keyid) => {
        const { ID: addressID = false } = addressesModel.get().find(({ Email }) => Email === email) || {};
        if (!addressID) {
            const keyObj = getKeyObject(keyid);
            const pmKey = await pmcw.getKeys(keyObj.PrivateKey);
            const [, , email] = pmKey[0].users[0].userId.userid.split(/(<|>)/g);
            // fallback on keyid: happens when reactivating keys
            return reformat(decryptedKeys, email).then((formattedKeys) => createKeys(formattedKeys, addressID, keyid));
        }
        return reformat(decryptedKeys, email).then((formattedKeys) => createKeys(formattedKeys, addressID, keyid));
    };

    const importKey = async (file, email, keyid) => {
        const privateKeys = await extractPrivateKeys(file, keyid);
        if (privateKeys.length === 0) {
            throw new Error(gettextCatalog.getString('Invalid private key file.', null, 'Error message'));
        }

        const decryptedKeys = await decryptAll(privateKeys);
        if (decryptedKeys === null) {
            // handle cancel button
            return 0;
        }

        return importDecryptedKeys(decryptedKeys, email, keyid);
    };

    return { importKey };
}
export default importPrivateKey;
