angular.module('proton.squire')
    .directive('squireActions', ($rootScope) => ({
        link(scope, el, { squireActions, squireActionsSelect }) {

            const onClick = ({ target }) => {

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

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    }));
