import _ from 'lodash';
import { readFile } from '../../../helpers/fileHelper';

/* @ngInject */
function addressKeysView(
    downloadFile,
    gettextCatalog,
    importPrivateKey,
    notification,
    Key,
    exportKeyModal,
    exportPrivateKeyModal,
    reactivateKeyModal,
    confirmModal,
    unlockUser,
    networkActivityTracker,
    reactivateKeys,
    eventManager
) {
    const I18N = {
        IMPORT_MESSAGE: gettextCatalog.getString(
            'Are you sure you want to import a private key? Importing an insecurely generated or leaked private key can harm the security of your emails.'
        ),
        IMPORT_TITLE: gettextCatalog.getString('Import private key', null, 'Confirm modal title'),
        DOWNLOAD_PUBLIC: gettextCatalog.getString('Download Public Key', null, ''),
        DOWNLOAD_PUBLIC_MESSAGE: gettextCatalog.getString('This key has not been activated. It is only possible to export the public key. Do you want to export the public key?', null, ''),
        INVALID_PRIVATE_KEY: gettextCatalog.getString('Cannot read private key', null, 'Error'),
        PRIVATE_KEY_PRIMARY: gettextCatalog.getString('Primary key changed', null, 'Success'),
        ERROR: gettextCatalog.getString('Error reactivating key. Please try again', null, 'Error')
    };
    const KEY_FILE_EXTENSION = '.asc';

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
                    privateKey: privateKey,
                    export(data) {
                        download(data, email, 'private');
                        exportPrivateKeyModal.deactivate();
                    },
                    cancel() {
                        exportPrivateKeyModal.deactivate();
                    }
                }
            }));
    };


    const exportKey = ({ email }, { PublicKey, PrivateKey, decrypted }) => {
        if (!decrypted) {
            confirmModal.activate({
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
            return;
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

    const makePrimaryKey = (address, { ID }) => {
        const promise = Key.primary(ID)
            .then(eventManager.call)
            .then(() => notification.success(I18N.PRIVATE_KEY_PRIMARY));
        networkActivityTracker.track(promise);
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

            const importKeyAddress = element[0].querySelector('.import-private-key-address');
            const importKeyId = element[0].querySelector('.import-private-key-id');
            const importKeyFile = element[0].querySelector('.import-private-key-file');

            const importKeyChange = () => {
                if (importKeyFile.files.length === 0) {
                    importKeyFile.value = '';
                    return;
                }
                reactivateKeyModal.deactivate();
                const promise = Promise.all(_.map(importKeyFile.files, readFile))
                    .then((file) => importPrivateKey.importKey(file.join('\n'), importKeyAddress.value, importKeyId.value))
                    .then((count) => eventManager.call().then(() => count))
                    .then((count) => {
                        if (count === 0) {
                            return;
                        }
                        if (importKeyAddress.value) {
                            notification.success(gettextCatalog.getPlural(count, 'Private key imported', '{{$count}} Private keys imported', {}));
                        } else {
                            notification.success(gettextCatalog.getString('Private key reactivated'));
                        }
                    })
                    .then(
                        () => {
                            importKeyFile.value = '';
                        },
                        (err) => {
                            importKeyFile.value = '';
                            throw err;
                    });
                networkActivityTracker.track(promise);
            };

            const importKey = ({ email }) => {
                confirmModal.activate({
                    params: {
                        title: I18N.IMPORT_TITLE,
                        message: I18N.IMPORT_MESSAGE,
                        icon: 'fa fa-warning',
                        confirm() {
                            importKeyAddress.value = email;
                            importKeyId.value = '';
                            importKeyFile.click();
                            confirmModal.deactivate();
                        },
                        cancel: confirmModal.deactivate
                    }
                });
            };

            const reactivateKey = (address, key) => {
                reactivateKeyModal.activate({
                    params: {
                        submit(password) {
                            reactivateKeyModal.deactivate();
                            const promise = reactivateKeys([key], password)
                                .then(({ success, failed }) => {
                                    success && notification.success(success);
                                    failed && notification.error(failed);
                                });

                            networkActivityTracker.track(promise);
                        },
                        import() {
                            importKeyAddress.value = '';
                            importKeyId.value = key.ID;
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
                importKey,
                reactivateKey,
                exportKey,
                makePrimaryKey
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
