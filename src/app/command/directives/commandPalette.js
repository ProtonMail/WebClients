/* @ngInject */
function commandPalette(AppModel, dispatchers) {
    return {
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/command/commandPalette.tpl.html'),
        link(scope, el) {
            let $input;

            const hide = () => {
                scope.$applyAsync(() => {
                    scope.isVisible = false;
                    AppModel.set('commandPalette', false);
                });
            };

            const { on, unsubscribe } = dispatchers();

            on('hotkeys', (e, { type }) => {
                type === 'escape' && hide();

                if (type === 'commandPalette') {
                    scope.$applyAsync(() => {
                        scope.isVisible = !scope.isVisible;
                        AppModel.set('commandPalette', scope.isVisible);
                        _rAF(() => {
                            if (!$input) {
                                $input = el.find('input');
                            }
                            $input.focus(); // Autofocus doesn't work on MacOS
                        });
                    });
                }
            });

            el.on('reset', hide);

            scope.$on('$destroy', () => {
                unsubscribe();
                el.off('reset', hide);
            });
        }
    };
}
export default commandPalette;
