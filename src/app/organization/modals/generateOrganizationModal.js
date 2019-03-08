import _ from 'lodash';
import { decryptPrivateKey, encryptMessage, encryptPrivateKey } from 'pmcrypto';
import { computeKeyPassword, generateKeySalt } from 'pm-srp';

import { DEFAULT_ENCRYPTION_CONFIG } from '../../constants';

/* @ngInject */
function generateOrganizationModal(
    pmModal,
    authentication,
    networkActivityTracker,
    organizationApi,
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
            this.encryptionConfigName = DEFAULT_ENCRYPTION_CONFIG;
            this.newRecoveryPassword = '';
            this.confirmRecoveryPassword = '';
            this.otherAdmins = params.otherAdmins;
            this.size = this.encryptionConfigName;

            this.submit = () => {
                const encryptionConfigName = this.size || this.encryptionConfigName;
                const password = this.newRecoveryPassword;

                let decryptedKey;

                const payload = { Tokens: [] };

                return networkActivityTracker.track(
                    setupKeys
                        .generateOrganization(authentication.getPassword(), encryptionConfigName)
                        .then(({ privateKeyArmored }) => {
                            payload.PrivateKey = privateKeyArmored;
                            return privateKeyArmored;
                        })
                        .then((armored) => decryptPrivateKey(armored, authentication.getPassword()))
                        .then((pkg) => {
                            decryptedKey = pkg;

                            const promises = [];

                            // Backup key
                            payload.BackupKeySalt = generateKeySalt();
                            promises.push(
                                computeKeyPassword(password, payload.BackupKeySalt)
                                    .then((keyPassword) => encryptPrivateKey(pkg, keyPassword))
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
                                                encryptMessage({
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

                                                organizationApi
                                                    .replaceKeys(creds, payload)
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
                                                    .catch((e) => {
                                                        reject(e);
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
                );
            };

            this.cancel = () => {
                params.cancel();
            };
        }
    });
}
export default generateOrganizationModal;
