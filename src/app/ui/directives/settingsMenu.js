angular.module('proton.ui')
.directive('settingsMenu', (authentication, CONSTANTS, networkActivityTracker, $rootScope, sidebarSettingsModel) => {

    const CLASS_SUBUSER = 'settingsMenu-is-subuser';
    const CLASS_MEMBER = 'settingsMenu-is-member';
    const CLASS_KEY_PHASE = 'settingsMenu-keyphase-active';

    return {
        replace: true,
        scope: {},
        templateUrl: 'templates/directives/ui/settingsMenu.tpl.html',
        link(scope, el) {
            const unsubscribe = [];
            scope.listStates = Object.keys(sidebarSettingsModel.getStateConfig());

            (CONSTANTS.KEY_PHASE > 3) && el[0].classList.add(`${CLASS_KEY_PHASE}`);
            authentication.user.subuser && el[0].classList.add(CLASS_SUBUSER);

            if (authentication.user.Role === CONSTANTS.PAID_MEMBER_ROLE) {
                el[0].classList.add(CLASS_MEMBER);
            }

            unsubscribe.push($rootScope.$on('updateUser', () => {
                el[0].classList.add(CLASS_MEMBER);
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
