/* @ngInject */
function addFilePopover($rootScope, editorModel, CONSTANTS, squireExecAction, onCurrentMessage) {
    const dispatch = (data) => {
        $rootScope.$emit('squire.editor', {
            type: 'popover.form',
            data
        });
    };
    const { DEFAULT_SQUIRE_VALUE } = CONSTANTS;
    const IMAGE = DEFAULT_SQUIRE_VALUE.IMAGE;
    const CLASS_HIDDEN = 'addFilePopover-hidden';

    const onPopover = (message, node, scope) => {
        return ({ action, form, name }, formName) => {
            if (formName !== name) {
                return;
            }
            switch (action) {
                case 'update':
                    squireExecAction.insertImage(message, { url: form.url });
                    break;
                case 'close':
                    node.classList.add(CLASS_HIDDEN);
                    scope.$applyAsync(() => (scope.data.image = IMAGE));
                    break;
            }
        };
    };

    const onChangeFile = (message, node) => (e) => {
        const file = e.target.files[0];
        squireExecAction.insertImage(message, { url: '', file });
        node.classList.add(CLASS_HIDDEN);
        // Reset input value to trigger the change event if you select the same file again
        _rAF(() => (e.target.value = null));
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/squire/addFilePopover.tpl.html'),
        link(scope, el, { name }) {
            const hide = () => {
                el[0].classList.add(CLASS_HIDDEN);
                dispatch({ name, form: {}, action: 'close.popover', message: scope.message });
            };
            const $embedded = el[0].querySelector('.addFilePopover-btn-embedded');
            const $uri = el[0].querySelector('.addFilePopover-btn-uri');
            const $input = el[0].querySelector('.addFilePopover-input-file');
            const onChange = onChangeFile(scope.message, el[0]);
            const onClickUri = () => {
                $input.click();
                hide();
            };

            $uri.addEventListener('click', onClickUri, false);
            $embedded.addEventListener('click', hide, false);
            $input.addEventListener('change', onChange, false);

            const onAction = (type, data = {}) => {
                if (type === 'popover.form') {
                    const modelPopover = onPopover(scope.message, el[0], scope);
                    return modelPopover(data, name);
                }

                if (type === 'squireActions' && data.action === 'insertImage') {
                    el[0].classList.toggle(CLASS_HIDDEN);
                    return _rAF(() => el[0].querySelector('input').focus());
                }
            };

            const unsubscribe = onCurrentMessage('squire.editor', scope, onAction);

            scope.$on('$destroy', () => {
                unsubscribe();
                $uri.removeEventListener('click', onClickUri, false);
                $embedded.removeEventListener('click', hide, false);
                $input.removeEventListener('change', onChange, false);
            });
        }
    };
}
export default addFilePopover;
