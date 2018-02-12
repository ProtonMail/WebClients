/* @ngInject */
function pmMeModel(addressModel, askPassword, authentication, gettextCatalog, networkActivityTracker, notification, User) {
    const I18N = {
        PM_ME: {
            paid() {
                return gettextCatalog.getString(
                    'You can now send and receive email from your new {{name}}@pm.me address!',
                    { name: authentication.user.Name },
                    'Success notification for paid user after @pm.me generation'
                );
            },
            free() {
                return gettextCatalog.getString(
                    'You can now receive email from your new {{name}}@pm.me address! To send from it, please upgrade to a paid ProtonMail plan',
                    { name: authentication.user.Name },
                    'Success notification for free user after @pm.me generation'
                );
            }
        }
    };

    /**
     * Unlock the session to add the @pm.me address
     */
    const activate = () => {
        const success = I18N.PM_ME[authentication.hasPaidMail() ? 'paid' : 'free']();

        askPassword((Password, TwoFactorCode) => {
            const promise = User.unlock({ Password, TwoFactorCode })
                .then(addressModel.generatePmMe)
                .then(User.lock)
                .then(() => notification.success(success));

            networkActivityTracker.track(promise);
        });
    };

    return { activate };
}

export default pmMeModel;
