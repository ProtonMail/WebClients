/* @ngInject */
function title(dispatchers, pageTitlesModel, $state) {
    const bindTitle = (el, title) => _rAF(() => el.text(title));

    return {
        restrict: 'E',
        scope: {},
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            on('$stateChangeSuccess', (e, state) => {
                bindTitle(el, pageTitlesModel.find(state));
            });

            // Update the counter
            on('elements', (e, { type }) => {
                type === 'refresh' &&
                    !$state.is('secured.label.element') &&
                    bindTitle(el, pageTitlesModel.find($state.current));
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default title;
