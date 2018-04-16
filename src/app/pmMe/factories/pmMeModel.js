/* @ngInject */
function pmMeModel(addressModel, askPassword, authentication, setupAddressModal, gettextCatalog, networkActivityTracker, notification, User, premiumDomainModel) {
    const I18N = {
        info: gettextCatalog.getString('Set a display name and signature for {{email}}', { email: premiumDomainModel.email() }, 'Info to setup @pm.me address'),
        paid() {
            return gettextCatalog.getString(
                'You can now send and receive email from your new {{email}} address!',
                { email: premiumDomainModel.email() },
                'Success notification for paid user after @pm.me generation'
            );
        },
        free() {
            return gettextCatalog.getString(
                'You can now receive email to your new {{email}} address! To send from it, please upgrade to a paid ProtonMail plan',
                { email: premiumDomainModel.email() },
                'Success notification for free user after @pm.me generation'
            );
        }
    };

    const confirmAddress = (callback) => {
        setupAddressModal.activate({
            params: {
                info: I18N.info,
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
        const success = I18N[hasPaidMail ? 'paid' : 'free']();
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

    return { activate };
}

export default pmMeModel;
