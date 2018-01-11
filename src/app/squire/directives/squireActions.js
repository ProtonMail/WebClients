/* @ngInject */
const squireActions = ($rootScope) => ({
    link(scope, el, { squireActions, squireActionsSelect }) {
        const onMouseDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const target = e.target;

            if (!squireActionsSelect) {
                $rootScope.$emit('squire.editor', {
                    type: 'squireActions',
                    data: {
                        action: squireActions,
                        message: scope.message
                    }
                });
            }

            if (target.nodeName === 'LI') {
                return $rootScope.$emit('squire.editor', {
                    type: 'squireActions',
                    data: {
                        action: squireActions,
                        argument: {
                            value: target.dataset.value,
                            label: target.textContent.trim()
                        },
                        message: scope.message
                    }
                });
            }
        };

        el.on('mousedown', onMouseDown);

        scope.$on('$destroy', () => {
            el.off('mousedown', onMouseDown);
        });
    }
});
export default squireActions;
