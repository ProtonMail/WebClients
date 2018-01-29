/* @ngInject */
function squirePopover($rootScope, onCurrentMessage) {
    const dispatch = (data) => {
        $rootScope.$emit('squire.editor', {
            type: 'popover.form',
            data
        });
    };

    const toJSON = (node) => {
        const list = angular.element(node).serializeArray();
        return list.reduce((acc, { name, value }) => ((acc[name] = value), acc), {});
    };

    const onAction = (scope, action, name) => (e) => {
        const { keyCode, target, type } = e;
        const message = scope.message;
        const reset = () => {
            scope.$applyAsync(() => {
                target.value = '';
                scope.data = {};
            });
        };

        e.preventDefault();
        e.stopPropagation();

        if (type !== 'keyup') {
            const form = toJSON(target);
            dispatch({ name, action, form, message });
            dispatch({ name, form, action: 'close', message });
            reset();
        }

        if (keyCode === 27) {
            dispatch({
                message,
                name,
                action: 'close',
                form: toJSON(target)
            });
            reset();
        }
    };

    return {
        link(scope, el, { name, action }) {
            const unsubscribe = [];
            const CLASSNAME_HIDDEN = `${name}-hidden`;
            const close = () => {
                if (!el[0].classList.contains(CLASSNAME_HIDDEN)) {
                    el[0].classList.add(CLASSNAME_HIDDEN);
                    dispatch({ name, form: {}, action: 'close.popover', message: scope.message });
                }
            };

            const onSubmit = onAction(scope, 'update', name);
            const onReset = onAction(scope, 'remove', name);
            const onKeyUp = onAction(scope, 'close', name);

            const closeDropdown = ({ target }) => {
                if (!el[0].contains(target) && !target.hasAttribute('data-squire-details')) {
                    close();
                }
            };

            unsubscribe.push(
                onCurrentMessage('squire.editor', scope, (type, data) => {
                    if (type === 'squire.native.action' || (type === 'squireActions' && data.action !== action)) {
                        close();
                    }

                    if (type === 'squire.toolbar' || (type === 'squireDropdown' && data.type === 'is.open')) {
                        close();
                    }
                })
            );

            unsubscribe.push(
                onCurrentMessage('composer.update', scope, (type) => {
                    type === 'editor.focus' && close();
                })
            );

            el.on('submit', onSubmit);
            el.on('reset', onReset);
            el.on('keyup', onKeyUp);
            document.addEventListener('mousedown', closeDropdown);

            unsubscribe.push(() => el.off('submit', onSubmit));
            unsubscribe.push(() => el.off('reset', onReset));
            unsubscribe.push(() => el.off('keyup', onKeyUp));
            unsubscribe.push(() => document.removeEventListener('mousedown', closeDropdown));

            scope.$on('$destroy', () => {
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
            });
        }
    };
}

export default squirePopover;
