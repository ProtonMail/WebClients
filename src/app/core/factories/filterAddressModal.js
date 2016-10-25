angular.module('proton.core')
.factory('filterAddressModal', ($timeout, pmModal, IncomingDefault, networkActivityTracker, notify) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/filterAddress.tpl.html',
        controller(params) {
            this.filter = {
                Email: '',
                Location: params.location
            };

            this.create = function () {
                networkActivityTracker.track(
                    IncomingDefault.add(this.filter)
                    .then((result) => {
                        if (result.data && result.data.Code === 1000) {
                            params.add(result.data.IncomingDefault);
                        } else if (result.data && result.data.Error) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        }
                    })
                );
            }.bind(this);

            this.cancel = function () {
                params.close();
            };

            $timeout(() => {
                angular.element('#emailAddress').focus();
            });
        }
    });
});
