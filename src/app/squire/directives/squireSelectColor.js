angular.module('proton.squire')
    .directive('squireSelectColor', (onCurrentMessage) => {

        const CLASS_HIDDEN = 'changeColor-hidden';
        const CLASS_TOGGLE = 'squireSelectColor-is-open';

        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/squire/squireSelectColor.tpl.html',
            link(scope, el) {

                const $i = el[0].querySelector('mark');
                const $popover = el[0].querySelector('.squireSelectColor-popover');

                const onAction = (type, data = {}) => {

                    if (type === 'squireActions' && data.action === 'changeColor') {
                        $popover.classList.toggle(CLASS_HIDDEN);
                        el[0].classList.toggle(CLASS_TOGGLE);
                    }

                    if (type === 'popover.form' && data.action === 'close.popover' && data.name === 'changeColor') {
                        el[0].classList.remove(CLASS_TOGGLE);
                    }
                };

                // Click button select color
                const onClick = ({ target }) => {
                    if (target.hasAttribute('data-color') && target.getAttribute('data-mode') === 'color') {
                        $i.style.color = target.getAttribute('data-color');
                        $popover.classList.add(CLASS_HIDDEN);
                        el[0].classList.remove(CLASS_TOGGLE);
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
