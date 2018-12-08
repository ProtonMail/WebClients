import { KEY_FILE_EXTENSION } from '../../constants';

/* @ngInject */
function deleteKeyProcess(
    confirmModal,
    gettextCatalog,
    unlockUser,
    exportPrivateKeyModal,
    downloadFile,
    eventManager,
    Key,
    keysModel,
    notification,
    networkActivityTracker
) {
    const I18N = {
        WARNING_TITLE: gettextCatalog.getString('Warning', null, 'Title'),
        WARNING_MESSAGE: gettextCatalog.getString(
            `This feature is intended for advanced users only!
        After deleting this key, you will not be able to decrypt any message that is encrypted with this key.
        It may lead to data loss. Are you sure you want to continue?`,
            null,
            'Confirm message'
        ),
        EXPORT_TITLE: gettextCatalog.getString('Key backup', null, 'Title'),
        EXPORT_MESSAGE: gettextCatalog.getString(
            `Deleting your keys is irreversible.
        To be able to access any message encrypted with this key, you might want to make a back up of this key for later use.
        Do you want to export this key?`,
            null,
            'Confirm message'
        ),
        EXPORT_ACTION: gettextCatalog.getString('Export', null, 'Action'),
        SUCCES_NOTIFICATION: gettextCatalog.getString('Key deleted', null, 'Success')
    };
    /**
     * Warns the user of the dangers of deleting a key. Allows the user to cancel the process.
     * @return {Promise}
     */
    const warnUser = () =>
        new Promise((resolve, reject) => {
            confirmModal.activate({
                params: {
                    title: I18N.WARNING_TITLE,
                    message: I18N.WARNING_MESSAGE,
                    confirm() {
                        confirmModal.deactivate().then(resolve);
                    },
                    cancel() {
                        confirmModal.deactivate().then(reject);
                    }
                }
            });
        });
    /**
     * Exports the private key on request of the user.
     * @param {String} email The email address belonging to the key object
     * @param {String} PrivateKey The armored private key we want to export
     */
    const exportPrivateKey = (email, privateKey) => {
        return unlockUser().then(
            () =>
                new Promise((resolve, reject) =>
                    exportPrivateKeyModal.activate({
                        params: {
                            privateKey,
                            export(data) {
                                const blob = new Blob([data], { type: 'data:text/plain;charset=utf-8;' });
                                const filename = 'privatekey.' + email + KEY_FILE_EXTENSION;

                                downloadFile(blob, filename);
                                exportPrivateKeyModal.deactivate().then(resolve);
                            },
                            cancel() {
                                exportPrivateKeyModal.deactivate().then(reject);
                            }
                        }
                    })
                )
        );
    };
    /**
     * Asks the user whether he/she wants to export the key as a backup before deleting the key.
     * This function will trigger the export process before returning if the user choses to do so.
     * @param {String} email The email address belonging to the key object
     * @param {Object} Key An object describing the key we want to delete / export
     * @return {Promise}
     */
    const exportKey = (email, { PrivateKey }) =>
        new Promise((resolve, reject) => {
            confirmModal.activate({
                params: {
                    title: I18N.EXPORT_TITLE,
                    message: I18N.EXPORT_MESSAGE,
                    confirmText: I18N.EXPORT_ACTION,
                    confirm() {
                        confirmModal.deactivate();
                        exportPrivateKey(email, PrivateKey)
                            .then(resolve)
                            .catch(reject);
                    },
                    cancel() {
                        confirmModal.deactivate();
                        resolve();
                    }
                }
            });
        });
    /**
     * Deletes the specified key, triggering the eventmanager and notifying the user of the result.
     * @param {Object} Key An object describing the key we want to delete
     * @param {String} addressID
     * @return {Promise}
     */
    const deleteKey = async ({ ID }, addressID) => {
        const SignedKeyList = await keysModel.signedKeyList(addressID, {
            mode: 'remove',
            keyID: ID
        });
        const promise = Key.remove(ID, { SignedKeyList })
            .then(eventManager.call)
            .then(() => notification.success(I18N.SUCCES_NOTIFICATION));
        return networkActivityTracker.track(promise);
    };
    /**
     * Starts the key deletion process
     * @param {Object} Address the address object from which we want to delete a key
     * @param {Object} Key The key object describing the key we want to delete
     * @return {Promise}
     */
    const start = async ({ email, addressID }, keyInfo) => {
        await warnUser();
        keyInfo.decrypted && (await exportKey(email, keyInfo));
        return deleteKey(keyInfo, addressID);
    };
    return { start };
}
export default deleteKeyProcess;
