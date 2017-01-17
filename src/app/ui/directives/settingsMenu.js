angular.module('proton.ui')
.directive('settingsMenu', (authentication, CONSTANTS, donateModal, Payment, networkActivityTracker, $rootScope) => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/ui/settingsMenu.tpl.html',
        link(scope) {
            const unsubscribes = [];
            scope.isSubUser = authentication.user.subuser;
            scope.isMember = authentication.user.Role === CONSTANTS.PAID_MEMBER_ROLE;
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
            unsubscribes.push($rootScope.$on('updateUser', () => {
                scope.isMember = authentication.user.Role === CONSTANTS.PAID_MEMBER_ROLE;
            }));
            scope.$on('$destroy', () => {
                unsubscribes.forEach((callback) => callback());
            });
        }
    };
});
