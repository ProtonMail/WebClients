angular.module('proton.core')
.factory('setupOrganizationModal', (authentication, pmModal, passwords, networkActivityTracker, Organization, Member, CONSTANTS, setupKeys, pmcw) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/setupOrganization.tpl.html',
        controller(params, $scope) {
            const self = this;
            const base = CONSTANTS.BASE_SIZE;
            const steps = ['name', 'keys', 'password', 'storage'];
            const methods = [name, keys, password, storage];
            const payload = {};
            let index = 0;
            let decryptedKey;
            self.step = steps[index];
            self.size = 2048;
            self.space = params.space;
            self.sliderValue = 0;
            self.sliderOptions = {
                start: 0,
                step: 0.1,
                range: { min: 0, max: 20 }
            };
            self.next = () => {
                const promise = methods[index]()
                .then((result = {}) => {
                    const { data = {} } = result;
                    if (data.Error) {
                        return Promise.reject(data.Error);
                    }
                    return Promise.resolve();
                })
                .then(() => {
                    const step = steps[index];
                    if (step === 'storage') {
                        params.close();
                    } else {
                        index++;
                        $scope.$applyAsync(() => {
                            self.step = steps[index];
                        });
                    }
                });
                networkActivityTracker.track(promise);
            };
            self.cancel = () => {
                params.close();
            };
            function name() {
                const DisplayName = self.name;

                return Organization.updateOrganizationName({ DisplayName });
            }
            function keys() {
                const mailboxPassword = authentication.getPassword();
                const bitSize = self.size;

                return setupKeys.generateOrganization(mailboxPassword, bitSize)
                .then(({ privateKeyArmored }) => {
                    payload.PrivateKey = privateKeyArmored;
                    return privateKeyArmored;
                })
                .then((armored) => pmcw.decryptPrivateKey(armored, mailboxPassword))
                .then((pkg) => decryptedKey = pkg);
            }
            function password() {
                const organizationPassword = self.organizationPassword;

                payload.Tokens = [];
                payload.BackupKeySalt = passwords.generateKeySalt();

                return passwords.computeKeyPassword(organizationPassword, payload.BackupKeySalt)
                .then((keyPassword) => pmcw.encryptPrivateKey(decryptedKey, keyPassword))
                .then((armored) => payload.BackupPrivateKey = armored)
                .then(() => Organization.updateOrganizationKeys(payload));
            }
            function storage() {
                const memberID = params.memberID;
                const quota = self.sliderValue * base * base * base;

                return Member.quota(memberID, quota);
            }
        }
    });
});
