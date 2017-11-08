angular.module('proton.organization')
    .factory('activateOrganizationKeys', (organizationApi, pmcw, notification, authentication, passwords, networkActivityTracker, gettextCatalog, eventManager) => {

        const I18N = {
            ERROR_FETCH_BACKUP: gettextCatalog.getString('Error retrieving backup organization keys', null, 'Error'),
            ERROR_PASSWORD: gettextCatalog.getString('Password incorrect. Please try again', null, 'Error')
        };

        function setup(context) {

            const activateKeys = async (pkg) => {
                const PrivateKey = await pmcw.encryptPrivateKey(pkg, authentication.getPassword());
                const { data = {} } = await organizationApi.activateKeys({ PrivateKey });
                if (data.Code !== 1000) {
                    throw new Error(data.Error || context.ERROR_MESSAGE);
                }
                notification.success(context.SUCCESS_MESSAGE);
            };

            const regenerateKeys = async (passcode) => {
                try {
                    const { data = {} } = await organizationApi.getBackupKeys();

                    if (data.Code !== 1000) {
                        throw new Error(data.Error || I18N.ERROR_FETCH_BACKUP);
                    }

                    const { PrivateKey, KeySalt } = data;
                    const keyPassword = await passwords.computeKeyPassword(passcode, KeySalt);
                    const pkg = await pmcw.decryptPrivateKey(PrivateKey, keyPassword);
                    await activateKeys(pkg);
                    return pkg;
                } catch (e) {
                    console.error(e);
                    throw new Error(I18N.ERROR_PASSWORD);
                }
            };

            const reload = (passcode) => {
                const promise = regenerateKeys(passcode)
                    .then((pkg) => (eventManager.call(), pkg));
                networkActivityTracker.track(promise);
                return promise;
            };

            return { reload };
        }

        return setup;
    });
