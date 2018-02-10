/* @ngInject */
function addFilePopover(editorState, CONSTANTS, squireExecAction) {
    const { DEFAULT_SQUIRE_VALUE } = CONSTANTS;
    const IMAGE = DEFAULT_SQUIRE_VALUE.IMAGE;
    const CLASS_HIDDEN = 'addFilePopover-hidden';

    return {
        replace: true,
        templateUrl: require('../../../templates/squire/addFilePopover.tpl.html'),
        link(scope, $el) {
            const ID = scope.message.ID;
            const el = $el[0];

            const hide = () => {
                editorState.set(ID, { popover: undefined });
            };

            const onChangeFile = (e) => {
                const file = e.target.files[0];
                squireExecAction.insertImage(scope.message, { url: '', file });
                // Reset input value to trigger the change event if you select the same file again
                hide();
                return _rAF(() => (e.target.value = null));
            };

            const onStateChange = ({ popover: oldPopover }, { popover }) => {
                if (popover === 'insertImage') {
                    el.classList.remove(CLASS_HIDDEN);
                    return _rAF(() => el.querySelector('input').focus());
                } else if (oldPopover === 'insertImage') {
                    el.classList.add(CLASS_HIDDEN);
                    scope.$applyAsync(() => (scope.data.image = IMAGE));
                }
            };

            const onSubmit = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };

            const $input = el.querySelector('.addFilePopover-input-file');

            const onClick = ({ target }) => {
                switch (target.name) {
                    case 'adduri':
                        $input.click();
                        hide();
                        break;
                    case 'addurl':
                        squireExecAction.insertImage(scope.message, { url: el.url.value });
                        hide();
                        break;
                    case 'addembedded':
                        hide();
                        break;
                }
            };

            editorState.on(ID, onStateChange, ['popover']);

            el.addEventListener('submit', onSubmit, false);
            el.addEventListener('click', onClick, false);
            $input.addEventListener('change', onChangeFile, false);

            scope.$on('$destroy', () => {
                editorState.off(ID, onStateChange);

                el.removeEventListener('submit', onSubmit, false);
                el.addEventListener('click', onClick, false);
                $input.removeEventListener('change', onChangeFile, false);
            });
        }
    };
}

export default addFilePopover;
