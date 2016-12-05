angular.module('proton.core')
.factory('generateOrganizationModal', (pmModal, authentication, networkActivityTracker, Organization, pmcw, passwords, setupKeys, loginPasswordModal, notify, gettextCatalog) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/generateOrganization.tpl.html',
        controller(params) {

            // Parameters
            this.size = 2048;
            this.newRecoveryPassword = '';
            this.confirmRecoveryPassword = '';
            this.otherAdmins = params.otherAdmins;

            // Functions
            this.submit = () => {

                const numBits = this.size;
                const password = this.newRecoveryPassword;

                let decryptedKey;

                const payload = { Tokens: [] };

                return networkActivityTracker.track(setupKeys.generateOrganization(authentication.getPassword(), numBits)
                .then(({ privateKeyArmored }) => {
                    payload.PrivateKey = privateKeyArmored;
                    return privateKeyArmored;
                })
                .then((armored) => pmcw.decryptPrivateKey(armored, authentication.getPassword()))
                .then((pkg) => {
                    decryptedKey = pkg;

                    const promises = [];

                    // Backup key
                    payload.BackupKeySalt = passwords.generateKeySalt();
                    promises.push(passwords.computeKeyPassword(password, payload.BackupKeySalt)
                        .then((keyPassword) => pmcw.encryptPrivateKey(pkg, keyPassword))
                        .then((armored) => {
                            payload.BackupPrivateKey = armored;
                        }));

                    // Member tokens
                    _.each(params.nonPrivate, (member) => {

                        let memberKeys = member.Keys.slice();

                        _.each(member.Addresses, (address) => {
                            memberKeys = memberKeys.concat(address.Keys);
                        });

                        _.each(memberKeys, (key) => {
                            promises.push(setupKeys.decryptMemberToken(key, params.existingKey)
                                .then(({ decryptedToken }) => pmcw.encryptMessage(decryptedToken, pkg.toPublic().armor(), [], [pkg]))
                                .then((Token) => {
                                    payload.Tokens.push({ ID: key.ID, Token });
                                }));
                        });
                    });

                    return Promise.all(promises).then(() => payload);
                })
                .then((payload) => new Promise((resolve, reject) => {
                    loginPasswordModal.activate({
                        params: {
                            submit(currentPassword, twoFactorCode) {
                                loginPasswordModal.deactivate();

                                const creds = {
                                    Password: currentPassword,
                                    TwoFactorCode: twoFactorCode
                                };

                                return Organization.replaceKeys(payload, creds)
                                .then(({ data }) => {
                                    if (data && data.Code === 1000) {
                                        notify({ message: gettextCatalog.getString('Organization keys change successful', null, 'Error'), classes: 'notification-success' });
                                        return resolve(params.submit(decryptedKey));
                                    } else if (data && data.Error) {
                                        return reject(new Error(data.Error));
                                    }
                                    reject(new Error(gettextCatalog.getString('Error changing organization keys', null, 'Error')));
                                });
                            },
                            cancel() {
                                loginPasswordModal.deactivate();
                                reject();
                            },
                            hasTwoFactor: authentication.user.TwoFactor
                        }
                    });
                }))
                .catch((error) => {
                    if (error && error.message) {
                        notify({ message: error.message, classes: 'notification-danger' });
                    }
                }));
            };

            this.cancel = () => {
                params.cancel();
            };
        }
    });
});
