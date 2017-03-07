angular.module('proton.ui')
.directive('settingsMenu', (authentication, CONSTANTS, networkActivityTracker, $rootScope, sidebarSettingsModel, AppModel) => {
    const CLASS_SUBUSER = 'settingsMenu-is-subuser';
    const CLASS_MEMBER = 'settingsMenu-is-member';

    return {
        replace: true,
        scope: {},
        templateUrl: 'templates/directives/ui/settingsMenu.tpl.html',
        link(scope, el) {
            const unsubscribes = [];
            const isMember = () => authentication.user.Role === CONSTANTS.PAID_MEMBER_ROLE;
            scope.listStates = Object.keys(sidebarSettingsModel.getStateConfig());

            authentication.user.subuser && el[0].classList.add(CLASS_SUBUSER);
            isMember() && el[0].classList.add(CLASS_MEMBER);

            unsubscribes.push($rootScope.$on('updateUser', () => {
                isMember() && el[0].classList.add(CLASS_MEMBER);
            }));

            unsubscribes.push($rootScope.$on('$stateChangeStart', () => {
                AppModel.set('showSidebar', false);
            }));

            scope.$on('$destroy', () => {
                unsubscribes.forEach((cb) => cb());
                unsubscribes.length = 0;
            });
        }
    };
});
