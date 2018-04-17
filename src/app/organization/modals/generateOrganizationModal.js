import _ from 'lodash';

/* @ngInject */
function generateOrganizationModal(
    pmModal,
    authentication,
    networkActivityTracker,
    organizationApi,
    pmcw,
    passwords,
    setupKeys,
    loginPasswordModal,
    notification,
    gettextCatalog
) {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: require('../../../templates/modals/generateOrganization.tpl.html'),
        /* @ngInject */
        controller: function(params) {
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

                return networkActivityTracker.track(
                    setupKeys
                        .generateOrganization(authentication.getPassword(), numBits)
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
                            promises.push(
                                passwords
                                    .computeKeyPassword(password, payload.BackupKeySalt)
                                    .then((keyPassword) => pmcw.encryptPrivateKey(pkg, keyPassword))
                                    .then((armored) => {
                                        payload.BackupPrivateKey = armored;
                                    })
                            );

                            // Member tokens
                            _.each(params.nonPrivate, (member) => {
                                let memberKeys = member.Keys.slice();

                                _.each(member.Addresses, (address) => {
                                    memberKeys = memberKeys.concat(address.Keys);
                                });

                                _.each(memberKeys, (key) => {
                                    promises.push(
                                        setupKeys
                                            .decryptMemberToken(key, params.existingKey)
                                            .then(({ decryptedToken }) =>
                                                pmcw.encryptMessage({
                                                    data: decryptedToken,
                                                    publicKeys: pkg.toPublic(),
                                                    privateKeys: pkg
                                                })
                                            )
                                            .then(({ data }) => {
                                                payload.Tokens.push({ ID: key.ID, Token: data });
                                            })
                                    );
                                });
                            });

                            return Promise.all(promises).then(() => payload);
                        })
                        .then(
                            (payload) =>
                                new Promise((resolve, reject) => {
                                    loginPasswordModal.activate({
                                        params: {
                                            submit(currentPassword, twoFactorCode) {
                                                loginPasswordModal.deactivate();

                                                const creds = {
                                                    Password: currentPassword,
                                                    TwoFactorCode: twoFactorCode
                                                };

                                                return organizationApi
                                                    .replaceKeys(payload, creds)
                                                    .then(() => {
                                                        notification.success(
                                                            gettextCatalog.getString(
                                                                'Organization keys change successful',
                                                                null,
                                                                'Error'
                                                            )
                                                        );
                                                        return resolve(params.submit(decryptedKey));
                                                    })
                                                    .catch(({ data = {} } = {}) => {
                                                        return reject(new Error(data.Error));
                                                    });
                                            },
                                            cancel() {
                                                loginPasswordModal.deactivate();
                                                reject();
                                            }
                                        }
                                    });
                                })
                        )
                        .catch((error) => {
                            if (error) {
                                notification.error(error);
                            }
                        })
                );
            };

            this.cancel = () => {
                params.cancel();
            };
        }
    });
}
export default generateOrganizationModal;
