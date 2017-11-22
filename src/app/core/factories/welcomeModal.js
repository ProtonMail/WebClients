angular.module('proton.core')
    .factory('welcomeModal', (pmModal, settingsApi, authentication, networkActivityTracker) => {
        function saveDisplayName(DisplayName) {
            const promise = settingsApi.display({ DisplayName });

            authentication.user.DisplayName = this.displayName;
            networkActivityTracker.track(promise);
        }
        return pmModal({
            controllerAs: 'ctrl',
            templateUrl: 'templates/modals/welcome.tpl.html',
            /* @ngInject */
            controller: function (params) {
                this.displayName = authentication.user.DisplayName;
                this.cancel = params.cancel;
                this.next = () => {
                    this.displayName.length && saveDisplayName(this.displayName);
                    params.next();
                };
            }
        });
    });
