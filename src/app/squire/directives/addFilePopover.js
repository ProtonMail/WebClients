angular.module('proton.squire')
    .directive('addFilePopover', (editorModel, CONSTANTS, squireExecAction, onCurrentMessage) => {

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
                        scope.$applyAsync(() => scope.data.image = IMAGE);
                        break;
                }
            };
        };

        const onChangeFile = (message, node) => (e) => {
            const file = e.target.files[0];
            squireExecAction.insertImage(message, { url: '', file });
            node.classList.add(CLASS_HIDDEN);
            // Reset input value to trigger the change event if you select the same file again
            _rAF(() => e.target.value = null);
        };

        return {
            replace: true,
            templateUrl: 'templates/squire/addFilePopover.tpl.html',
            link(scope, el, { name }) {

                const $embedded = el[0].querySelector('.addFilePopover-btn-embedded');
                const $uri = el[0].querySelector('.addFilePopover-btn-uri');
                const $input = el[0].querySelector('.addFilePopover-input-file');
                const onChange = onChangeFile(scope.message, el[0]);
                const onClick = () => el[0].classList.add(CLASS_HIDDEN);
                const onClickUri = () => {
                    $input.click();
                    el[0].classList.add(CLASS_HIDDEN);
                };

                $uri.addEventListener('click', onClickUri, false);
                $embedded.addEventListener('click', onClick, false);
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
                    $embedded.removeEventListener('click', onClick, false);
                    $input.removeEventListener('change', onChange, false);
                });
            }
        };
    });
