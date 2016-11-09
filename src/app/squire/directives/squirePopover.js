angular.module('proton.squire')
    .directive('squirePopover', ($rootScope) => {

        const dispatch = (data) => {
            $rootScope.$emit('squire.editor', {
                type: 'popover.form', data
            });
        };

        const toJSON = (node) => {
            const list = angular.element(node).serializeArray();
            return list.reduce((acc, { name, value }) => (acc[name] = value, acc), {});
        };

        const onAction = (scope, action, name) => ({ keyCode, target, type }) => {

            const message = scope.message;
            const reset = () => {
                scope.$applyAsync(() => {
                    target.value = '';
                    scope.data = {};
                });
            };

            if (type !== 'keyup') {
                const form = toJSON(target);
                dispatch({ name, action, form, message });
                dispatch({ name, form, action: 'close', message });
                reset();
            }

            if (keyCode === 27) {
                dispatch({
                    message,
                    name, action: 'close',
                    form: toJSON(target)
                });
                reset();
            }
        };

        return {
            link(scope, el, attr) {

                const onSubmit = onAction(scope, 'update', attr.name);
                const onReset = onAction(scope, 'remove', attr.name);
                const onKeyUp = onAction(scope, 'close', attr.name);

                el.on('submit', onSubmit);
                el.on('reset', onReset);
                el.on('keyup', onKeyUp);

                scope.$on('$destroy', () => {
                    el.off('submit', onSubmit);
                    el.off('reset', onReset);
                    el.off('keyup', onKeyUp);
                });
            }
        };
    });
