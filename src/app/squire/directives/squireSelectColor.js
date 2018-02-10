/* @ngInject */
function squireSelectColor(editorState) {
    const CLASS_HIDDEN = 'changeColor-hidden';
    const CLASS_TOGGLE = 'squireSelectColor-is-open';

    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/squire/squireSelectColor.tpl.html'),
        link(scope, el) {
            const ID = scope.message.ID;
            const $i = el[0].querySelector('mark');
            const $popover = el[0].querySelector('.squireSelectColor-popover');

            const onStateChange = ({ popover: oldPopover, color: oldColor }, { color, popover }) => {
                if (oldColor !== color) {
                    $i.style.color = color;
                }
                if (popover === 'changeColor') {
                    $popover.classList.remove(CLASS_HIDDEN);
                    el[0].classList.add(CLASS_TOGGLE);
                } else if (oldPopover === 'changeColor') {
                    $popover.classList.add(CLASS_HIDDEN);
                    el[0].classList.remove(CLASS_TOGGLE);
                }
            };

            editorState.on(ID, onStateChange, ['color', 'popover']);

            scope.$on('$destroy', () => {
                editorState.off(ID, onStateChange);
            });
        }
    };
}

export default squireSelectColor;
