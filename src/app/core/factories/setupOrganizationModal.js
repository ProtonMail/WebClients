angular.module('proton.core')
.factory('setupOrganizationModal', (authentication, pmModal, passwords, networkActivityTracker, organizationApi, organizationModel, memberApi, CONSTANTS, setupKeys, pmcw, gettextCatalog) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/setupOrganization.tpl.html',
        controller(params, $scope) {
            const self = this;
            const base = CONSTANTS.BASE_SIZE;
            const steps = ['name', 'keys', 'password', 'storage'];
            const methods = [name, keys, password, storage];
            const payload = {};
            const organization = organizationModel.get();
            const defaultStorage = 5;
            let index = 0;
            let decryptedKey;
            self.min = 0;
            self.max = organization.MaxSpace;
            self.unit = base * base * base;
            self.step = steps[index];
            self.size = 2048;
            const minPadding = authentication.user.UsedSpace / self.unit;

            self.sliderOptions = {
                animate: false,
                start: Math.min(Math.max(Math.round((authentication.user.UsedSpace / self.unit) + 1), defaultStorage), self.max / self.unit),
                step: 0.1,
                connect: [true, false],
                tooltips: true,
                range: { min: self.min / self.unit, max: self.max / self.unit },
                pips: {
                    mode: 'values',
                    values: [0, self.max / self.unit],
                    density: 4
                },
                minPadding,
                legend: 'GB'
            };

            const allocatedLegend = { label: gettextCatalog.getString('Allocated', null), classes: 'background-primary' };
            const minPaddingLegend = { label: gettextCatalog.getString('Already used', null), classes: 'background-red-striped' };

            self.legends = [allocatedLegend];
            minPadding > 0 && self.legends.push(minPaddingLegend);

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

                return organizationApi.updateOrganizationName({ DisplayName });
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
                .then(() => organizationApi.updateOrganizationKeys(payload));
            }
            function storage() {
                const memberID = params.memberID;
                const quota = Math.round(self.sliderValue * self.unit);

                return memberApi.quota(memberID, quota);
            }
        }
    });
});
