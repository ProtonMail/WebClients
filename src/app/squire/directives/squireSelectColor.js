angular.module('proton.squire')
    .directive('squireSelectColor', (onCurrentMessage) => {

        const CLASS_HIDDEN = 'changeColor-hidden';

        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/squire/squireSelectColor.tpl.html',
            link(scope, el) {

                const $popover = el[0].querySelector('.squireSelectColor-popover');

                const onAction = (type, data = {}) => {
                    if (type === 'squireActions' && data.action === 'changeColor') {
                        $popover.classList.toggle(CLASS_HIDDEN);
                    }
                };

                // Click button select color
                const onClick = ({ target }) => {
                    if (target.hasAttribute('data-color')) {
                        $popover.classList.add(CLASS_HIDDEN);
                    }
                };

                el.on('click', onClick);
                const unsubscribe = onCurrentMessage('squire.editor', scope, onAction);

                scope.$on('$destroy', () => {
                    el.off('click', onClick);
                    unsubscribe();
                });

            }
        };
    });
