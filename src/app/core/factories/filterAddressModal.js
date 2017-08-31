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
            /* @ngInject */
            controller: function (params) {

                this.filter = { Email: '', Location: params.location };
                this.cancel = () => params.close();
                this.create = () => {
                    const promise = create(this.filter)
                        .then((data) => params.add(data.IncomingDefault));

                    networkActivityTracker.track(promise);
                };

                setTimeout(() => {
                    angular.element('#emailAddress').focus();
                }, 100);
            }
        });
    });
