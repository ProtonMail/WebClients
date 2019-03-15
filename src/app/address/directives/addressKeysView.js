import _ from 'lodash';
import { decryptPrivateKey } from 'pmcrypto';

import { KEY_FLAGS, KEY_FILE_EXTENSION } from '../../constants';
import { readFileAsString } from '../../../helpers/fileHelper';

/* @ngInject */
function addressKeysView(
    addressesModel,
    dispatchers,
    downloadFile,
    gettextCatalog,
    importPrivateKey,
    notification,
    Key,
    keysModel,
    exportKeyModal,
    exportPrivateKeyModal,
    reactivateKeyModal,
    confirmModal,
    unlockUser,
    networkActivityTracker,
    reactivateKeys,
    eventManager,
    generateModal,
    authentication,
    deleteKeyProcess,
    selectAddressModal,
    translator
) {
    const I18N = translator(() => ({
        SELECT_ADDRESS_TO_ADD_KEY: gettextCatalog.getString(
            'Select an address to which the new key will be attached',
            null,
            'Info'
        ),
        SELECT_ADDRESS_TO_IMPORT_KEY: gettextCatalog.getString(
            'Select an address to which the imported key will be attached',
            null,
            'Info'
        ),
        IMPORT_MESSAGE: gettextCatalog.getString(
            'Are you sure you want to import a private key? Importing an insecurely generated or leaked private key can harm the security of your emails.',
            null,
            'Confirm message'
        ),
        IMPORT_TITLE: gettextCatalog.getString('Import private key', null, 'Confirm modal title'),
        DOWNLOAD_PUBLIC: gettextCatalog.getString('Download Public Key', null, 'Confirm modal title'),
        DOWNLOAD_PUBLIC_MESSAGE: gettextCatalog.getString(
            'This key has not been activated. It is only possible to export the public key. Do you want to export the public key?',
            null,
            'Confirm message'
        ),
        INVALID_PRIVATE_KEY: gettextCatalog.getString('Cannot read private key', null, 'Error'),
        GENERATE_KEY_MESSAGE: gettextCatalog.getString(
            'You can generate a new encryption key if you think your previous key has been compromised.',
            null,
            'Title'
        ),
        PRIVATE_KEY_PRIMARY: gettextCatalog.getString('Primary key changed', null, 'Success'),
        PRIVATE_KEY_ENCRYPTION_DISABLED: gettextCatalog.getString('Encryption disabled', null, 'Success'),
        PRIVATE_KEY_SIGNATURE_ENABLED: gettextCatalog.getString('Signature verification enabled', null, 'Success'),
        PRIVATE_KEY_COMPROMISED: gettextCatalog.getString(
            'Encryption and signature verification disabled',
            null,
            'Success'
        ),
        PRIVATE_KEY_VALID: gettextCatalog.getString('Encryption enabled', null, 'Success'),
        ERROR: gettextCatalog.getString('Error reactivating key. Please try again', null, 'Error'),
        generateKeyTitle(email) {
            return gettextCatalog.getString('New Address Key ({{ email }})', { email }, 'Title');
        },
        privateKeyImported(count) {
            return gettextCatalog.getPlural(
                count,
                'Private key imported',
                '{{$count}} Private keys imported',
                {},
                'Success'
            );
        },
        PRIVATE_KEY_REACTIVATED: gettextCatalog.getString('Private key reactivated', null, 'Success')
    }));

    const onEvent = (element, type, callback) => {
        element.addEventListener(type, callback);
        return () => element.removeEventListener(type, callback);
    };

    /**
     * Download key
     * @param {String} key
     * @param {String} email
     * @param {String} type - 'public' or 'private'
     */
    const download = (key, email, type) => {
        const blob = new Blob([key], { type: 'data:text/plain;charset=utf-8;' });
        const filename = type + 'key.' + email + KEY_FILE_EXTENSION;

        downloadFile(blob, filename);
    };

    const downloadPublic = ({ email }, { PublicKey }) => download(PublicKey, email, 'public');

    const exportPrivate = (privateKey, email) => {
        // ask for password, to prevent malicious invaders from accessing this feature unauthorized
        // prevents someone accessing your logged in protonmail account and exporting your keys
        // e.g. a secret agent extracting your keys
        unlockUser().then(() =>
            exportPrivateKeyModal.activate({
                params: {
                    privateKey,
                    export(data) {
                        download(data, email, 'private');
                        exportPrivateKeyModal.deactivate();
                    },
                    cancel() {
                        exportPrivateKeyModal.deactivate();
                    }
                }
            })
        );
    };

    const exportKey = ({ email }, { PublicKey, PrivateKey, decrypted }) => {
        if (!decrypted) {
            return confirmModal.activate({
                params: {
                    title: I18N.DOWNLOAD_PUBLIC,
                    message: I18N.DOWNLOAD_PUBLIC_MESSAGE,
                    confirm() {
                        download(PublicKey, email, 'public');
                        confirmModal.deactivate();
                    },
                    cancel: confirmModal.deactivate
                }
            });
        }

        exportKeyModal.activate({
            params: {
                exportPublic() {
                    download(PublicKey, email, 'public');
                    exportKeyModal.deactivate();
                },
                exportPrivate() {
                    exportPrivate(PrivateKey, email);
                    exportKeyModal.deactivate();
                },
                cancel: exportKeyModal.deactivate
            }
        });
    };

    const makePrimaryKey = async ({ addressID }, { ID, PrivateKey }) => {
        const SignedKeyList = await keysModel.signedKeyList(addressID, {
            mode: 'set-primary',
            decryptedPrivateKey: await decryptPrivateKey(PrivateKey, authentication.getPassword()),
            encryptedPrivateKey: PrivateKey
        });
        const promise = Key.primary(ID, { SignedKeyList })
            .then(eventManager.call)
            .then(() => notification.success(I18N.PRIVATE_KEY_PRIMARY));
        networkActivityTracker.track(promise);
    };

    /**
     * Creates a function that sets a certain flag on the given key
     * @param {Integer} flags KEY_FLAGS value
     * @param {String} messageUp The notification message to be displayed on upgrade
     * @param {String} messageDown The notification message to be displayed on downgrade
     * @return {Function} (address, key) A function taking an address object and the key object as input
     */
    const createMarker = (flags, messageUp, messageDown) => async ({ addressID }, { ID, Flags, PrivateKey }) => {
        const SignedKeyList = await keysModel.signedKeyList(addressID, {
            mode: 'mark',
            newFlags: flags,
            encryptedPrivateKey: PrivateKey
        });
        const promise = Key.flags(ID, { Flags: flags, SignedKeyList })
            .then(eventManager.call)
            .then(() => notification.success(Flags < flags ? messageUp : messageDown));
        networkActivityTracker.track(promise);
    };
    /**
     * Marks a given key as obsolete
     * @param {Object} The address object
     * @param {Object} The key object
     */
    const markObsolete = createMarker(
        KEY_FLAGS.ENABLE_VERIFICATION,
        I18N.PRIVATE_KEY_SIGNATURE_ENABLED,
        I18N.PRIVATE_KEY_ENCRYPTION_DISABLED
    );
    /**
     * Marks a given key as compromised
     * @param {Object} The address object
     * @param {Object} The key object
     */
    const markCompromised = createMarker(
        KEY_FLAGS.DISABLED,
        I18N.PRIVATE_KEY_COMPROMISED,
        I18N.PRIVATE_KEY_COMPROMISED
    );
    /**
     * Marks a given key as valid, removing all limitations
     * @param {Object} The address object
     * @param {Object} The key object
     */
    const markValid = createMarker(
        KEY_FLAGS.ENABLE_VERIFICATION | KEY_FLAGS.ENABLE_ENCRYPTION,
        I18N.PRIVATE_KEY_VALID,
        I18N.PRIVATE_KEY_VALID
    );

    const doImport = async (files, { type, address, key }) => {
        const file = await Promise.all(_.map(files, readFileAsString));
        const count = await importPrivateKey.importKey(file.join('\n'), address, key);

        await eventManager.call();

        if (count === 0) {
            return;
        }

        if (type === 'import') {
            return notification.success(I18N.privateKeyImported(count));
        }

        notification.success(I18N.PRIVATE_KEY_REACTIVATED);
    };

    return {
        replace: true,
        restrict: 'E',
        scope: {
            displayMode: '@',
            isSubUser: '<',
            addresses: '<'
        },
        templateUrl: require('../../../templates/address/addressKeysView.tpl.html'),
        link(scope, element) {
            const unsubscribe = [];
            const { dispatcher } = dispatchers(['dropdown']);
            const importKeyFile = element[0].querySelector('.import-private-key-file');

            let STATE = {};

            const resetState = () => {
                STATE = {};
                importKeyFile.value = '';
            };

            if (authentication.isPrivate()) {
                element[0].classList.add('addressKeysView-is-private');
            }

            const importKeyChange = () => {
                if (importKeyFile.files.length === 0) {
                    importKeyFile.value = '';
                    return;
                }
                reactivateKeyModal.deactivate();

                networkActivityTracker
                    .track(doImport(importKeyFile.files, STATE))
                    .then(resetState)
                    .catch(resetState);
            };

            const selectAddress = (info) => {
                const addresses = addressesModel.get().map(({ Email: email, ID: addressID }) => ({ email, addressID }));
                return new Promise((resolve) => {
                    selectAddressModal.activate({
                        params: {
                            info,
                            addresses,
                            hookClose: (mode) => mode && resolve({}),
                            async submit(address) {
                                await selectAddressModal.deactivate();
                                resolve(address);
                            }
                        }
                    });
                });
            };

            const importKey = async () => {
                const { email } = await selectAddress(I18N.SELECT_ADDRESS_TO_IMPORT_KEY);

                if (!email) {
                    return;
                }

                confirmModal.activate({
                    params: {
                        title: I18N.IMPORT_TITLE,
                        message: I18N.IMPORT_MESSAGE,
                        icon: 'fa fa-warning',
                        confirm() {
                            STATE = {
                                type: 'import',
                                address: email
                            };
                            importKeyFile.click();
                            confirmModal.deactivate();
                        }
                    }
                });
            };

            /**
             * Triggers a process that allows the user to generate a new key for the given address
             */
            const newKey = async () => {
                const { email: Email, addressID: ID } = await selectAddress(I18N.SELECT_ADDRESS_TO_ADD_KEY);

                if (!Email) {
                    return;
                }

                generateModal.activate({
                    params: {
                        addresses: [{ Email, ID }],
                        title: I18N.generateKeyTitle(Email),
                        message: I18N.GENERATE_KEY_MESSAGE,
                        class: 'generateNewKey small',
                        password: authentication.getPassword(),
                        primary: false,
                        onSuccess() {
                            generateModal.deactivate();
                        },
                        close() {
                            generateModal.deactivate();
                        }
                    }
                });
            };

            const reactivateKey = ({ addressID, email }, key) => {
                reactivateKeyModal.activate({
                    params: {
                        submit(password) {
                            reactivateKeyModal.deactivate();
                            const toProcess = [
                                {
                                    addressID,
                                    keys: [key]
                                }
                            ];
                            const promise = reactivateKeys.process(toProcess, password).then(({ success, failed }) => {
                                success && notification.success(success);
                                failed && notification.error(failed);
                            });

                            networkActivityTracker.track(promise);
                        },
                        import() {
                            STATE = {
                                type: 'reactivate',
                                address: email,
                                key
                            };
                            importKeyFile.click();
                            // deactivation done in importKeyChange, so they can still cancel the select file popup
                        },
                        cancel() {
                            reactivateKeyModal.deactivate();
                        }
                    }
                });
            };

            const ACTIONS = {
                downloadPublic,
                newKey,
                importKey,
                reactivateKey,
                exportKey,
                makePrimaryKey,
                deleteKey: deleteKeyProcess.start,
                markObsolete,
                markCompromised,
                markValid
            };

            const clickDelegate = ({ target: { nodeName, dataset } }) => {
                const { action = false, addressId = null, keyIndex = null } = dataset;

                if (nodeName !== 'BUTTON' || !action) {
                    return;
                }

                const address = addressId && scope.addresses.find(({ addressID }) => addressID === addressId);
                const key = address && address.keys.length > keyIndex && address.keys[keyIndex];

                const actionFunc = ACTIONS[action];

                if (actionFunc) {
                    actionFunc(address, key);
                }

                dispatcher.dropdown('close');
            };
            unsubscribe.push(onEvent(importKeyFile, 'change', importKeyChange));
            unsubscribe.push(onEvent(element[0], 'click', clickDelegate));

            scope.$on('$destroy', () => {
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
                importKeyFile.removeEventListener('change', importPrivateKey);
            });
        }
    };
}

export default addressKeysView;
