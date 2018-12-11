import { decryptPrivateKey, encryptPrivateKey } from 'pmcrypto';

/* @ngInject */
function activateOrganizationKeys(
    organizationApi,
    notification,
    authentication,
    passwords,
    networkActivityTracker,
    gettextCatalog,
    eventManager
) {
    const I18N = {
        ERROR_PASSWORD: gettextCatalog.getString('Password incorrect. Please try again', null, 'Error')
    };

    function setup(context) {
        const encryptPrivateKeyHelper = (pkg) => {
            try {
                return encryptPrivateKey(pkg, authentication.getPassword());
            } catch (err) {
                const { data = {} } = err;
                throw new Error(data.Error || context.ERROR_MESSAGE);
            }
        };

        const decryptPrivateKeyHelper = async (PrivateKey, KeySalt, passcode) => {
            try {
                const keyPassword = await passwords.computeKeyPassword(passcode, KeySalt);
                return decryptPrivateKey(PrivateKey, keyPassword);
            } catch (err) {
                throw new Error(I18N.ERROR_PASSWORD);
            }
        };

        const activateKeys = async (pkg) => {
            const PrivateKey = await encryptPrivateKeyHelper(pkg);
            const { data = {} } = await organizationApi.activateKeys({ PrivateKey });
            notification.success(context.SUCCESS_MESSAGE);
            return data;
        };

        const regenerateKeys = async (passcode) => {
            const { data = {} } = await organizationApi.getBackupKeys();
            const { PrivateKey, KeySalt } = data;
            const pkg = await decryptPrivateKeyHelper(PrivateKey, KeySalt, passcode);
            await activateKeys(pkg);
            return pkg;
        };

        const reload = (passcode) => {
            const promise = regenerateKeys(passcode).then((pkg) => (eventManager.call(), pkg));
            networkActivityTracker.track(promise);
            return promise;
        };

        return { reload };
    }

    return setup;
}
export default activateOrganizationKeys;
