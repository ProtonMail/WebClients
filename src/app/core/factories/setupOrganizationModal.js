angular.module('proton.core')
.factory('setupOrganizationModal', (pmModal, networkActivityTracker, Organization, Member, CONSTANTS) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/setupOrganization.tpl.html',
        controller(params) {
            const self = this;
            const base = CONSTANTS.BASE_SIZE;
            const steps = ['name', 'keys', 'password', 'storage'];
            const methods = [name, keys, password, storage];
            let index = 0;
            self.step = steps[index];
            self.size = 2048;
            self.units = [
                { label: 'MB', value: base * base },
                { label: 'GB', value: base * base * base }
            ];
            self.unit = self.units[0];
            self.space = params.space;
            self.next = () => {
                const promise = methods[index]()
                .then(({ data = {} }) => {
                    if (data.Code === 1000) {
                        return Promise.resolve();
                    }
                    if (data.Error) {
                        return Promise.reject(data.Error);
                    }
                    return Promise.reject();
                })
                .then(() => {
                    const step = steps[index];
                    if (step === 'storage') {
                        params.close();
                    } else {
                        index++;
                        self.step = steps[index];
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
                // TODO
            }
            function password() {
                // const password = self.password;
                // TODO
            }
            function storage() {
                const memberID = params.memberID;
                const unit = self.unit.value;
                const quota = self.quota * unit;
                return Member.quota(memberID, quota);
            }
        }
    });
});
