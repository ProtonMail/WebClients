/* @ngInject */
function squireSelectFontSize(editorState) {
    const IS_OPEN = 'squireDropdown-is-open';
    return {
        replace: true,
        templateUrl: require('../../../templates/squire/squireSelectFontSize.tpl.html'),
        link(scope, $el) {
            const ID = scope.message.ID;
            const el = $el[0];
            const button = el.querySelector('.squireToolbar-action-fontSize');

            const onStateChange = ({ popover: oldPopover, size: oldSize }, { popover, size }) => {
                if (oldSize !== size) {
                    button.textContent = size;
                    el.setAttribute('data-font-size', size);
                }
                if (popover === 'changeFontSize') {
                    el.classList.add(IS_OPEN);
                    const item = el.querySelector(`[data-value^="${size}"]`);
                    if (item) {
                        // To prevent scrolling the whole page, just the dropdown.
                        item.parentNode.scrollTop = item.offsetTop;
                    }
                } else if (oldPopover === 'changeFontSize') {
                    el.classList.remove(IS_OPEN);
                }
            };

            const onClick = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };

            el.addEventListener('mousedown', onClick);

            onStateChange({}, editorState.get(ID));
            editorState.on(ID, onStateChange, ['popover', 'size']);

            scope.$on('$destroy', () => {
                editorState.off(ID, onStateChange);
                el.removeEventListener('mousedown', onClick);
            });
        }
    };
}

export default squireSelectFontSize;
