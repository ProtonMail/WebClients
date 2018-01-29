/* @ngInject */
function activateOrganizationKeys(
    organizationApi,
    pmcw,
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
        const activateKeys = async (pkg) => {
            try {
                const PrivateKey = await pmcw.encryptPrivateKey(pkg, authentication.getPassword());
                const { data = {} } = await organizationApi.activateKeys({ PrivateKey });
                notification.success(context.SUCCESS_MESSAGE);
                return data;
            } catch (err) {
                const { data = {} } = err;
                throw new Error(data.Error || context.ERROR_MESSAGE);
            }
        };

        const regenerateKeys = async (passcode) => {
            try {
                const { data = {} } = await organizationApi.getBackupKeys();
                const { PrivateKey, KeySalt } = data;
                const keyPassword = await passwords.computeKeyPassword(passcode, KeySalt);
                const pkg = await pmcw.decryptPrivateKey(PrivateKey, keyPassword);
                await activateKeys(pkg);
                return pkg;
            } catch (err) {
                console.error(err);
                throw new Error(I18N.ERROR_PASSWORD);
            }
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
