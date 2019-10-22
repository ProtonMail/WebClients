/* @ngInject */
function viewTitle(dispatchers, pageTitlesModel, $state) {
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        template: '<span class="viewTitle-container"></span>',
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();
            const identity = (a) => a;
            const bindTitle = (state) => {
                const title = pageTitlesModel.find(state, true, identity);
                _rAF(() => el.text(title));
            };
            on('$stateChangeSuccess', (e, state) => {
                bindTitle(state);
            });

            bindTitle($state.current);

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default viewTitle;
