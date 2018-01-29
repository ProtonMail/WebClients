import _ from 'lodash';

/* @ngInject */
const squireActions = ($rootScope) => ({
    link(scope, el, { squireActions }) {
        const onMouseDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const target = e.target;

            const emitOptions = {
                type: 'squireActions',
                data: {
                    action: squireActions,
                    message: scope.message
                }
            };
            /**
             * Emit the action with value arguments if data-value is defined on the element.
             * This enables it to be more flexible, i.e. it can both used as a list and as
             * a single element.
             */
            if (_.has(target.dataset, 'value')) {
                emitOptions.data.argument = {
                    value: target.dataset.value,
                    label: target.textContent.trim()
                };
            }

            $rootScope.$emit('squire.editor', emitOptions);
        };

        el.on('mousedown', onMouseDown);

        scope.$on('$destroy', () => {
            el.off('mousedown', onMouseDown);
        });
    }
});
export default squireActions;
