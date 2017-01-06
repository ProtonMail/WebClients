angular.module('proton.ui')
.directive('settingsMenu', (authentication, CONSTANTS, donateModal, Payment, networkActivityTracker) => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/ui/settingsMenu.tpl.html',
        link(scope) {
            scope.isSubUser = authentication.user.subuser;
            scope.keyPhase = CONSTANTS.KEY_PHASE;
            scope.donate = () => {
                const promise = Payment.methods()
                .then(({ data = {} } = {}) => {
                    const { Code, PaymentMethods } = data;
                    if (Code === 1000) {
                        donateModal.activate({
                            params: {
                                methods: PaymentMethods,
                                close() {
                                    donateModal.deactivate();
                                }
                            }
                        });
                    }
                });
                networkActivityTracker.track(promise);
            };
        }
    };
});
