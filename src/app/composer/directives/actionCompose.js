angular.module('proton.composer')
    .directive('actionCompose', ($rootScope) => ({
        scope: {
            model: '=actionCompose'
        },
        link(scope, el, { actionComposeType }) {
            function onClick(e) {
                e.preventDefault();

                if (/addFile|addEmbedded/.test(actionComposeType)) {
                    return $rootScope.$emit('addFile', {
                        asEmbedded: (actionComposeType === 'addEmbedded'),
                        message: scope.model
                    });
                }

                $rootScope.$emit('composer.new', { type: actionComposeType, message: scope.model });
            }

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    }));
