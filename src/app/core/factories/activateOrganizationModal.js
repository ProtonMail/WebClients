angular.module('proton.core')
.factory('activateOrganizationModal', ($timeout, pmModal, networkActivityTracker, Organization, gettextCatalog, passwords, pmcw, authentication, notify) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/activateOrganization.tpl.html',
        controller(params) {

            this.inputCode = '';
            this.alertClass = params.alertClass || 'alert alert-danger';
            this.messageClass = 'alert alert-info';
            this.title = params.title || 'Administrator Key Activation';
            this.prompt = params.prompt || 'Enter activation passcode:';
            this.message = params.message || '';
            this.alert = params.alert || '';
            this.showReset = angular.isDefined(params.reset);

            $timeout(() => {
                $('#inputCode').focus();
            });

            this.submit = () => {

                const passcode = this.inputCode;

                networkActivityTracker.track(Organization.getBackupKeys()
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        return result.data;
                    } else if (result.data && result.data.Error) {
                        return Promise.reject(result.data.Error);
                    }
                    return Promise.reject(new Error(gettextCatalog.getString('Error retrieving backup organization keys', null, 'Error')));
                })
                .then(({ PrivateKey, KeySalt }) => {
                    return passwords.computeKeyPassword(passcode, KeySalt)
                    .then((keyPassword) => pmcw.decryptPrivateKey(PrivateKey, keyPassword))
                    .then(
                        (pkg) => {
                            return pmcw.encryptPrivateKey(pkg, authentication.getPassword())
                            .then((PrivateKey) => Organization.activateKeys({ PrivateKey }))
                            .then(({ data }) => {
                                if (data && data.Code === 1000) {
                                    notify({ message: params.successMessage, classes: 'notification-success' });
                                    params.submit(pkg);
                                    return;
                                } else if (data && data.Error) {
                                    return Promise.reject(new Error(data.Error));
                                }
                                return Promise.reject(new Error(params.errorMessage));
                            });
                        },
                        () => Promise.reject(new Error(gettextCatalog.getString('Passcode incorrect. Please try again', null, 'Error')))
                    );
                })
                .catch((error) => {
                    if (error && error.message) {
                        notify({ message: error.message, classes: 'notification-danger' });
                    }
                }));
            };

            this.cancel = () => {
                params.cancel();
            };

            this.reset = () => {
                params.reset();
            };
        }
    });
});
