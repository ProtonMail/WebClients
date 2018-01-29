/* @ngInject */
function colorPopover(squireExecAction) {
    return {
        replace: true,
        templateUrl: require('../../../templates/squire/colorPopover.tpl.html'),
        compile(el, { mode = 'color' }) {
            el.find('[data-hash]').attr('data-mode', mode);

            return (scope, el, { mode = 'color' }) => {
                const onMouseDown = ({ target }) => {
                    squireExecAction.changeColor(scope.message, target.dataset.color, mode);
                };

                el.on('mousedown', onMouseDown);

                scope.$on('$destroy', () => {
                    el.off('mousedown', onMouseDown);
                });
            };
        }
    };
}
export default colorPopover;
