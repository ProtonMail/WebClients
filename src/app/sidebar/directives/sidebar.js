/* @ngInject */
const sidebar = (sidebarModel) => ({
    scope: {},
    replace: true,
    templateUrl: require('../../../templates/partials/sidebar.tpl.html'),
    link(scope) {
        scope.listStates = Object.keys(sidebarModel.getStateConfig());
        scope.scrollbarConfig = {
            advanced: {
                updateOnContentResize: true
            },
            scrollInertia: 0,
            scrollButtons: {
                enable: false
            }
        };

        /**
         * For some reason ng-scrollbars doesn't update when the content is resized.
         * Force update it here.
         * Related to issue https://github.com/ProtonMail/Angular/issues/6260.
         */
        function onResize() {
            scope.$applyAsync(() => scope.updateScrollbar('update'));
        }

        window.addEventListener('resize', onResize);

        scope.$on('$destroy', () => {
            window.removeEventListener('resize', onResize);
        });
    }
});
export default sidebar;
