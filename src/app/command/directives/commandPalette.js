/* @ngInject */
function commandPalette(AppModel, dispatchers, hotkeys) {
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

            on('AppModel', (e, { type, data = {} }) => {
                if (type === 'commandPalette') {
                    if (data.value) {
                        return hotkeys.unbindAndKeep(['shift+space']);
                    }

                    hotkeys.unbind();
                    hotkeys.bind();
                }
            });

            el.on('reset', hide);

            scope.$on('$destroy', () => {
                unsubscribe();
                el.off('reset', hide);
                hotkeys.bind();
            });
        }
    };
}
export default commandPalette;
