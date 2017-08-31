angular.module('proton.core')
    .factory('filterAddressModal', (pmModal, IncomingDefault, networkActivityTracker) => {
        function create(filter) {
            IncomingDefault.add(filter)
                .then(({ data = {} } = {}) => {
                    if (data.Error) {
                        throw new Error(data.Error);
                    }
                    return data;
                });
        }

        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/filterAddress.tpl.html',
            controller(params) {
                const self = this;

                self.filter = { Email: '', Location: params.location };
                self.cancel = () => params.close();
                self.create = () => {
                    const promise = create(self.filter)
                        .then((data) => params.add(data.IncomingDefault));

                    networkActivityTracker.track(promise);
                };

                setTimeout(() => {
                    angular.element('#emailAddress').focus();
                }, 100);
            }
        });
    });
