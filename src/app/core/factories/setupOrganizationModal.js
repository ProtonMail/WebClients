angular.module('proton.core')
.factory('setupOrganizationModal', (pmModal) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/setupOrganization.tpl.html',
        controller(params) {
            const self = this;
            const steps = ['name', 'keys', 'password', 'storage'];
            const methods = {
                name() {

                },
                keys() {

                },
                password() {

                },
                storage() {

                }
            };
            let index = 0;
            self.step = steps[index];
            self.next = () => {
                const step = self.step[index];
                methods[step]()
                .then(() => {
                    if (step === 'storage') {
                        params.close();
                    } else {
                        index++;
                        self.step = steps[index];
                    }
                });
            };
            self.cancel = () => {
                params.close();
            };
        }
    });
});
