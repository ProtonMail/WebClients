/* @ngInject */
function colorPopover(squireExecAction) {
    return {
        replace: true,
        templateUrl: 'templates/squire/colorPopover.tpl.html',
        compile(el, { mode = 'color' }) {
            el.find('[data-hash]').attr('data-mode', mode);

            return (scope, el, { mode = 'color' }) => {
                const onClick = ({ target }) => {
                    squireExecAction.changeColor(scope.message, target.dataset.color, mode);
                };

                el.on('click', onClick);

                scope.$on('$destroy', () => {
                    el.off('click', onClick);
                });
            };
        }
    };
}
export default colorPopover;
