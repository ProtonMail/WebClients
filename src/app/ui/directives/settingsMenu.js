/* @ngInject */
function settingsMenu(authentication, backState, CONSTANTS, networkActivityTracker, dispatchers, sidebarSettingsModel, AppModel) {
    const IS_SUBUSER = 'settingsMenu-is-subuser';
    const IS_MEMBER = 'settingsMenu-is-member';
    const BACK_BUTTON = 'sidebar-btn-back';
    const onClick = () => backState.back();

    return {
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/directives/ui/settingsMenu.tpl.html'),
        link(scope, element) {
            const { unsubscribe, on } = dispatchers(['$stateChangeStart', 'appearance', 'updateUser']);
            const isMember = () => authentication.user.Role === CONSTANTS.PAID_MEMBER_ROLE;
            const $back = element.find(`.${BACK_BUTTON}`);
            const updateList = () => scope.listStates = Object.keys(sidebarSettingsModel.getStateConfig());

            updateList();

            authentication.user.subuser && element.addClass(IS_SUBUSER);
            isMember() && element.addClass(IS_MEMBER);

            on('updateUser', () => {
                isMember() && element.addClass(IS_MEMBER);

                scope.$applyAsync(() => {
                    updateList();
                });
            });

            on('$stateChangeStart', () => {
                AppModel.set('showSidebar', false);
            });

            on('appearance', (event, { type }) => {
                type === 'changingViewMode' && $back.prop('disabled', true);
                type === 'viewModeChanged' && $back.prop('disabled', false);
            });

            $back.on('click', onClick);

            scope.$on('$destroy', () => {
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
                $back.off('click', onClick);
            });
        }
    };
}
export default settingsMenu;
