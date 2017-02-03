angular.module('proton.ui')
.directive('settingsMenu', (authentication, CONSTANTS, networkActivityTracker, $rootScope, sidebarSettingsModel) => {

    const CLASS_SUBUSER = 'settingsMenu-is-subuser';
    const CLASS_MEMBER = 'settingsMenu-is-member';

    return {
        replace: true,
        scope: {},
        templateUrl: 'templates/directives/ui/settingsMenu.tpl.html',
        link(scope, el) {
            const unsubscribe = [];
            scope.listStates = Object.keys(sidebarSettingsModel.getStateConfig());
            const isMember = () => authentication.user.Role === CONSTANTS.PAID_MEMBER_ROLE;

            authentication.user.subuser && el[0].classList.add(CLASS_SUBUSER);
            isMember() && el[0].classList.add(CLASS_MEMBER);

            unsubscribe.push($rootScope.$on('updateUser', () => {
                isMember() && el[0].classList.add(CLASS_MEMBER);
            }));

            unsubscribe.push($rootScope.$on('$stateChangeStart', () => {
                $rootScope.$emit('sidebarMobileToggle', false);
            }));

            scope.$on('$destroy', () => {
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
            });
        }
    };
});
