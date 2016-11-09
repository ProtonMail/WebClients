angular.module('proton.squire')
    .directive('squireActions', ($rootScope) => ({
        link(scope, el, attr) {

            const onClick = () => {
                $rootScope.$emit('squire.editor', {
                    type: 'squireActions',
                    data: {
                        action: attr.squireActions,
                        message: scope.message
                    }
                });
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    }));
