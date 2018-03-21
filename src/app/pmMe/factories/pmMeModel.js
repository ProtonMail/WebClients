/* @ngInject */
function pmMeModel(addressModel, askPassword, authentication, setupAddressModal, gettextCatalog, networkActivityTracker, notification, User) {
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

    const confirmAddress = (callback) => {
        setupAddressModal.activate({
            params: {
                submit(model) {
                    setupAddressModal.deactivate();
                    callback(model);
                },
                cancel() {
                    setupAddressModal.deactivate();
                }
            }
        });
    };

    /**
     * Unlock the session to add the @pm.me address
     */
    const activate = () => {
        const hasPaidMail = authentication.hasPaidMail();
        const success = I18N.PM_ME[hasPaidMail ? 'paid' : 'free']();
        const process = ({ Password, TwoFactorCode, DisplayName, Signature }) => {
            const promise = User.unlock({ Password, TwoFactorCode })
                .then(() => addressModel.setup({ Domain: 'pm.me', DisplayName, Signature }))
                .then(User.lock)
                .then(() => notification.success(success));

            networkActivityTracker.track(promise);
        };

        askPassword((Password, TwoFactorCode) => {
            if (hasPaidMail) {
                confirmAddress(({ DisplayName, Signature }) => {
                    process({ Password, TwoFactorCode, DisplayName, Signature });
                });
                return;
            }

            process({ Password, TwoFactorCode });
        });
    };

    const email = () => `${authentication.user.Name}@pm.me`;

    return { activate, email };
}

export default pmMeModel;
