angular.module('proton.ui')
    .directive('settingsMenu', (authentication, CONSTANTS, networkActivityTracker, $rootScope, sidebarSettingsModel, AppModel) => {
        const IS_SUBUSER = 'settingsMenu-is-subuser';
        const IS_MEMBER = 'settingsMenu-is-member';
        const BACK_BUTTON = 'sidebar-btn-back';

        return {
            replace: true,
            scope: {},
            templateUrl: 'templates/directives/ui/settingsMenu.tpl.html',
            link(scope, element) {
                const unsubscribe = [];
                const isMember = () => authentication.user.Role === CONSTANTS.PAID_MEMBER_ROLE;
                const $back = element.find(`.${BACK_BUTTON}`);

                scope.listStates = Object.keys(sidebarSettingsModel.getStateConfig());

                authentication.user.subuser && element.addClass(IS_SUBUSER);
                isMember() && element.addClass(IS_MEMBER);

                unsubscribe.push($rootScope.$on('updateUser', () => {
                    isMember() && element.addClass(IS_MEMBER);
                }));

                unsubscribe.push($rootScope.$on('$stateChangeStart', () => {
                    AppModel.set('showSidebar', false);
                }));

                unsubscribe.push($rootScope.$on('appearance', (event, { type }) => {
                    (type === 'changingViewMode') && $back.prop('disabled', true);
                    (type === 'viewModeChanged') && $back.prop('disabled', false);
                }));

                scope.$on('$destroy', () => {
                    unsubscribe.forEach((cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
