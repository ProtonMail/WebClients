angular.module('proton.core')
.factory('welcomeModal', (pmModal, Setting, authentication, networkActivityTracker, $q) => {
    return pmModal({
        controllerAs: 'ctrl',
        templateUrl: 'templates/modals/welcome.tpl.html',
        controller(params) {
            this.displayName = authentication.user.DisplayName;

            this.cancel = () => {
                if (angular.isDefined(params.cancel) && angular.isFunction(params.cancel)) {
                    params.cancel();
                }
            };

            this.next = function () {
                const promises = [];

                if (this.displayName.length > 0) {
                    promises.push(Setting.display({ DisplayName: this.displayName }));
                    authentication.user.DisplayName = this.displayName;
                }

                networkActivityTracker.track(
                    $q.all(promises)
                    .then(() => {
                        if (angular.isDefined(params.next) && angular.isFunction(params.next)) {
                            params.next(this.displayName);
                        }
                    })
                );
            }.bind(this);
        }
    });
});
