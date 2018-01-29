/* @ngInject */
function squireSelectColor(onCurrentMessage, editorModel) {
    const CLASS_HIDDEN = 'changeColor-hidden';
    const CLASS_TOGGLE = 'squireSelectColor-is-open';
    const KEY_ARROW_INPUT = [38, 39, 40, 37, 33, 34, 36, 35]; // URDL FastUP FastDown

    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/squire/squireSelectColor.tpl.html'),
        link(scope, el) {
            const $i = el[0].querySelector('mark');
            const $popover = el[0].querySelector('.squireSelectColor-popover');
            const { editor } = editorModel.find(scope.message);

            const closePopover = () => {
                $popover.classList.add(CLASS_HIDDEN);
                el[0].classList.remove(CLASS_TOGGLE);
            };

            const onClickEditor = () => {
                const { color = 'rgb(34, 34, 34)' } = editor.getFontInfo() || {};
                $i.style.color = color;
                closePopover();
            };

            const onKeyup = (e) => {
                KEY_ARROW_INPUT.includes(e.keyCode) && onClickEditor();
            };

            editor.addEventListener('click', onClickEditor);
            editor.addEventListener('keyup', onKeyup);

            const onAction = (type, data = {}) => {
                if (type === 'squireActions' && data.action === 'changeColor') {
                    $popover.classList.toggle(CLASS_HIDDEN);
                    el[0].classList.toggle(CLASS_TOGGLE);
                }

                if (type === 'popover.form' && data.action === 'close.popover' && data.name === 'changeColor') {
                    closePopover();
                }
            };

            const onMouseDown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                const target = e.target;
                if (target.hasAttribute('data-color') && target.getAttribute('data-mode') === 'color') {
                    $i.style.color = target.getAttribute('data-color');
                    closePopover();
                }
            };

            el.on('mousedown', onMouseDown);
            const unsubscribe = onCurrentMessage('squire.editor', scope, onAction);

            scope.$on('$destroy', () => {
                el.off('mousedown', onMouseDown);
                editor.removeEventListener('click', onClickEditor);
                editor.removeEventListener('keyup', onKeyup);
                unsubscribe();
            });
        }
    };
}
export default squireSelectColor;
