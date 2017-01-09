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
            self.min = authentication.user.UsedSpace;
            self.max = params.organization.MaxSpace;
            self.unit = base * base * base;
            self.usedSpace = authentication.user.UsedSpace;
            self.step = steps[index];
            self.size = 2048;
            self.sliderValue = self.min / self.unit;
            self.sliderOptions = {
                start: self.min / self.unit,
                step: 0.1,
                connect: [true, false],
                tooltips: true,
                range: { min: self.min / self.unit, max: self.max / self.unit }
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
                const quota = self.sliderValue * self.unit;

                return Member.quota(memberID, quota);
            }
        }
    });
});
